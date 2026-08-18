"""Lightweight async RAWG API client with in-memory caching."""
import os
import httpx
from typing import Any

RAWG_BASE = "https://api.rawg.io/api"

# ✅ Correct way: read from .env
RAWG_KEY = os.getenv("RAWG_API_KEY")

_cache: dict[str, Any] = {}


async def _get(path: str, params: dict | None = None) -> dict:
    if not RAWG_KEY:
        raise ValueError("RAWG_API_KEY not set in environment")

    q = {"key": RAWG_KEY, **(params or {})}
    cache_key = f"{path}|{sorted(q.items())}"

    if cache_key in _cache:
        return _cache[cache_key]

    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(f"{RAWG_BASE}{path}", params=q)
        r.raise_for_status()
        data = r.json()

    _cache[cache_key] = data
    return data


async def list_games(search: str = "", genre: str = "", platform: str = "", ordering: str = "-rating", page: int = 1, page_size: int = 20):
    params = {
        "page": page,
        "page_size": page_size,
        "ordering": ordering,
    }
    if search:
        params["search"] = search
    if genre:
        params["genres"] = genre
    if platform:
        params["platforms"] = platform

    return await _get("/games", params)


async def game_detail(game_id: int | str):
    return await _get(f"/games/{game_id}")


async def game_screenshots(game_id: int | str):
    return await _get(f"/games/{game_id}/screenshots")


async def list_genres():
    return await _get("/genres", {"page_size": 30})


async def list_platforms():
    return await _get("/platforms", {"page_size": 40})