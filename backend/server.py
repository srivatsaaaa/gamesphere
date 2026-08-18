from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from specs_db import infer_game_requirements, score_rig_vs_game, cpu_tier, gpu_tier  # noqa: E402
from rawg_client import list_games, game_detail, game_screenshots, list_genres, list_platforms  # noqa: E402

# MongoDB
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="GameSphere API")
api = APIRouter(prefix="/api")

logger = logging.getLogger("gamesphere")
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


# ---------- Helpers ----------
def strip_html(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", text).strip()


def slim_game(g: dict) -> dict:
    """Compact a RAWG game object for list views."""
    return {
        "id": g.get("id"),
        "slug": g.get("slug"),
        "name": g.get("name"),
        "background_image": g.get("background_image"),
        "released": g.get("released"),
        "rating": g.get("rating"),
        "metacritic": g.get("metacritic"),
        "genres": [{"id": x["id"], "name": x["name"]} for x in (g.get("genres") or [])],
        "platforms": [{"id": p["platform"]["id"], "name": p["platform"]["name"]} for p in (g.get("platforms") or [])],
        "tags": [{"id": t["id"], "name": t["name"]} for t in (g.get("tags") or [])[:8]],
    }


def build_requirements(g: dict) -> dict:
    year = None
    if g.get("released"):
        try:
            year = int(g["released"][:4])
        except Exception:
            year = None
    genres = [x["name"] for x in (g.get("genres") or [])]
    reqs = infer_game_requirements(year, g.get("metacritic"), genres)

    # Try to pull the raw PC requirements string from RAWG
    raw_min, raw_rec = None, None
    for p in g.get("platforms") or []:
        if p.get("platform", {}).get("slug") == "pc":
            r = p.get("requirements") or {}
            raw_min = r.get("minimum")
            raw_rec = r.get("recommended")
            break
    reqs["raw_minimum"] = raw_min
    reqs["raw_recommended"] = raw_rec
    return reqs


# ---------- Models ----------
class RigIn(BaseModel):
    cpu: str
    gpu: str
    ram_gb: int
    storage_gb: Optional[int] = None
    notes: Optional[str] = None


class Rig(RigIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LibraryItemIn(BaseModel):
    game_id: int
    name: str
    background_image: Optional[str] = None
    status: str = "wishlist"  # playing | completed | wishlist | backlog
    rating: Optional[float] = None
    released: Optional[str] = None


class LibraryItem(LibraryItemIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LibraryPatch(BaseModel):
    status: Optional[str] = None


class CompatRequest(BaseModel):
    cpu: str
    gpu: str
    ram_gb: int
    game_id: int


class RecRuleRequest(BaseModel):
    genres: List[str] = []
    platform: Optional[str] = None
    min_rating: float = 0


class RecAIRequest(BaseModel):
    preferences: str
    favourite_games: List[str] = []


# ---------- Health ----------
@api.get("/")
async def root():
    return {"service": "GameSphere", "status": "ok"}


# ---------- Games ----------
@api.get("/games/discover")
async def discover_games(
    search: str = "",
    genre: str = "",
    platform: str = "",
    ordering: str = "-rating",
    page: int = 1,
    page_size: int = 20,
):
    try:
        data = await list_games(search=search, genre=genre, platform=platform, ordering=ordering, page=page, page_size=page_size)
        return {
            "count": data.get("count", 0),
            "next": data.get("next"),
            "previous": data.get("previous"),
            "results": [slim_game(g) for g in data.get("results", [])],
        }
    except Exception as e:
        logger.exception("discover failed")
        raise HTTPException(status_code=502, detail=f"RAWG error: {e}")


@api.get("/games/genres")
async def genres():
    data = await list_genres()
    return [{"id": g["id"], "name": g["name"], "slug": g["slug"], "image": g.get("image_background")} for g in data.get("results", [])]


@api.get("/games/platforms")
async def platforms():
    data = await list_platforms()
    return [{"id": p["id"], "name": p["name"], "slug": p["slug"]} for p in data.get("results", [])]


@api.get("/games/{game_id}")
async def game_full_detail(game_id: int):
    try:
        g = await game_detail(game_id)
        shots = await game_screenshots(game_id)
        slim = slim_game(g)
        slim["description"] = strip_html(g.get("description") or g.get("description_raw"))
        slim["website"] = g.get("website")
        slim["developers"] = [d.get("name") for d in (g.get("developers") or [])]
        slim["publishers"] = [p.get("name") for p in (g.get("publishers") or [])]
        slim["screenshots"] = [{"id": s["id"], "image": s["image"]} for s in (shots.get("results") or [])]
        slim["requirements"] = build_requirements(g)
        return slim
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("detail failed")
        raise HTTPException(status_code=502, detail=f"RAWG error: {e}")


# ---------- Compatibility ----------
@api.post("/compatibility/check")
async def check_compat(req: CompatRequest):
    try:
        g = await game_detail(req.game_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"RAWG error: {e}")
    reqs = build_requirements(g)
    result = score_rig_vs_game(req.cpu, req.gpu, req.ram_gb, reqs)
    result["game"] = {"id": g.get("id"), "name": g.get("name"), "background_image": g.get("background_image")}
    result["requirements"] = reqs
    return result


# ---------- Rig (single-user demo; singleton doc) ----------
RIG_ID = "default"


@api.get("/rig")
async def get_rig():
    doc = await db.rigs.find_one({"_id": RIG_ID}, {"_id": 0})
    return doc


@api.post("/rig")
async def save_rig(rig: RigIn):
    rig_doc = Rig(**rig.model_dump()).model_dump()
    await db.rigs.update_one({"_id": RIG_ID}, {"$set": rig_doc}, upsert=True)
    rig_doc["cpu_tier"] = cpu_tier(rig_doc["cpu"])
    rig_doc["gpu_tier"] = gpu_tier(rig_doc["gpu"])
    return rig_doc


# ---------- Library ----------
@api.get("/library")
async def list_library(status: Optional[str] = None):
    q = {"status": status} if status else {}
    items = await db.library.find(q, {"_id": 0}).to_list(500)
    return items


@api.post("/library")
async def add_library(item: LibraryItemIn):
    existing = await db.library.find_one({"game_id": item.game_id}, {"_id": 0})
    if existing:
        await db.library.update_one({"game_id": item.game_id}, {"$set": {"status": item.status}})
        existing["status"] = item.status
        return existing
    obj = LibraryItem(**item.model_dump()).model_dump()
    await db.library.insert_one({**obj})
    return obj


@api.patch("/library/{item_id}")
async def patch_library(item_id: str, patch: LibraryPatch):
    update = {k: v for k, v in patch.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    r = await db.library.update_one({"id": item_id}, {"$set": update})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Library item not found")
    doc = await db.library.find_one({"id": item_id}, {"_id": 0})
    return doc


@api.delete("/library/{item_id}")
async def delete_library(item_id: str):
    r = await db.library.delete_one({"id": item_id})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Library item not found")
    return {"ok": True}


# ---------- Recommendations ----------
@api.post("/recommendations/rule")
async def rec_rule(req: RecRuleRequest):
    # Build RAWG query from genres
    genre_param = ",".join(req.genres) if req.genres else ""
    data = await list_games(genre=genre_param, platform=req.platform or "", ordering="-rating", page=1, page_size=20)
    picks = [slim_game(g) for g in data.get("results", []) if (g.get("rating") or 0) >= req.min_rating]
    return {"picks": picks[:12], "reason": "Rule-based: matched your selected genres and rating threshold."}


@api.post("/recommendations/ai")
async def rec_ai(req: RecAIRequest):
    # Fetch a broad pool for the LLM to pick from
    data = await list_games(ordering="-rating", page=1, page_size=30)
    pool = [slim_game(g) for g in data.get("results", [])]
    catalog_text = "\n".join([f"- {g['name']} (genres: {', '.join(n['name'] for n in g['genres'])}; rating: {g['rating']})" for g in pool])

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage  # type: ignore
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM lib not installed: {e}")

    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")

    chat = LlmChat(
        api_key=api_key,
        session_id=f"rec-{uuid.uuid4()}",
        system_message=(
            "You are a gaming curator. Given a user's taste and a catalog of games, choose 5 best matches. "
            "Respond ONLY as JSON with this exact shape: "
            '{"picks": [{"name": "Game Name", "reason": "short reason"}]} — no prose, no markdown.'
        ),
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    user_prompt = (
        f"User preferences: {req.preferences}\n"
        f"User's favourite games: {', '.join(req.favourite_games) if req.favourite_games else 'none listed'}\n\n"
        f"Catalog:\n{catalog_text}\n\n"
        "Return strict JSON."
    )
    try:
        raw = await chat.send_message(UserMessage(text=user_prompt))
    except Exception as e:
        logger.exception("AI call failed")
        raise HTTPException(status_code=502, detail=f"AI error: {e}")

    import json
    txt = str(raw).strip()
    # Sometimes models wrap in code fences – strip them
    if txt.startswith("```"):
        txt = re.sub(r"^```(?:json)?|```$", "", txt, flags=re.MULTILINE).strip()
    try:
        parsed = json.loads(txt)
        picks_raw = parsed.get("picks", [])
    except Exception:
        picks_raw = []

    # Enrich picks with the slim game objects from the pool
    by_name = {g["name"].lower(): g for g in pool}
    enriched = []
    for p in picks_raw:
        g = by_name.get((p.get("name") or "").lower())
        if g:
            enriched.append({**g, "ai_reason": p.get("reason", "")})
    if not enriched:
        enriched = [{**pool[i], "ai_reason": "Top rated match"} for i in range(min(5, len(pool)))]
    return {"picks": enriched, "raw": txt}


# ---------- Mount ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def _shutdown():
    client.close()
