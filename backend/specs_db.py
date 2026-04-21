"""CPU / GPU tier tables used for hardware compatibility scoring.

Tiers go 1..10, where higher = faster. Values are approximate and grouped into
practical tiers used to rank a user's rig against game requirements.
"""

# GPU tiers (lower-cased keys)
GPU_TIERS = {
    # Tier 1 - integrated / very old
    "intel hd": 1, "intel uhd": 1, "vega 3": 1, "vega 8": 1, "gt 710": 1, "gt 730": 1,
    # Tier 2
    "gt 1030": 2, "gtx 750": 2, "gtx 750 ti": 2, "r7 240": 2, "hd 6000": 2,
    # Tier 3
    "gtx 950": 3, "gtx 960": 3, "r9 270": 3, "rx 550": 3, "rx 560": 3,
    # Tier 4
    "gtx 970": 4, "gtx 1050": 4, "gtx 1050 ti": 4, "rx 570": 4, "rx 580": 4,
    # Tier 5
    "gtx 1060": 5, "gtx 1650": 5, "gtx 1660": 5, "rx 590": 5, "rx 5500 xt": 5, "rtx 2050": 5,
    # Tier 6
    "gtx 1070": 6, "gtx 1660 ti": 6, "gtx 1660 super": 6, "rtx 2060": 6, "rx 5600 xt": 6, "rtx 3050": 6,
    # Tier 7
    "gtx 1080": 7, "rtx 2070": 7, "rtx 2070 super": 7, "rx 5700": 7, "rx 5700 xt": 7, "rtx 3060": 7,
    # Tier 8
    "gtx 1080 ti": 8, "rtx 2080": 8, "rtx 2080 super": 8, "rtx 3060 ti": 8, "rtx 3070": 8, "rx 6700 xt": 8, "rtx 4060": 8,
    # Tier 9
    "rtx 2080 ti": 9, "rtx 3070 ti": 9, "rtx 3080": 9, "rx 6800": 9, "rx 6800 xt": 9, "rtx 4060 ti": 9, "rtx 4070": 9,
    # Tier 10
    "rtx 3080 ti": 10, "rtx 3090": 10, "rtx 3090 ti": 10, "rtx 4070 ti": 10, "rtx 4080": 10, "rtx 4090": 10,
    "rx 6900 xt": 10, "rx 7900 xt": 10, "rx 7900 xtx": 10, "rtx 5080": 10, "rtx 5090": 10,
}

CPU_TIERS = {
    # Tier 1 - very old / low-end
    "pentium": 1, "celeron": 1, "atom": 1,
    # Tier 2
    "i3-2": 2, "i3-3": 2, "i3-4": 2, "a6": 2, "a8": 2, "fx-4": 2,
    # Tier 3
    "i5-2": 3, "i5-3": 3, "i5-4": 3, "fx-6": 3, "ryzen 3 1": 3,
    # Tier 4
    "i3-6": 4, "i3-7": 4, "i3-8": 4, "i5-6": 4, "i5-7": 4, "ryzen 3 2": 4, "ryzen 3 3": 4,
    # Tier 5
    "i5-8": 5, "i5-9": 5, "i7-4": 5, "i7-6": 5, "i7-7": 5, "ryzen 5 1": 5, "ryzen 5 2": 5,
    # Tier 6
    "i5-10": 6, "i5-11": 6, "i7-8": 6, "i7-9": 6, "ryzen 5 3": 6, "ryzen 7 1": 6, "ryzen 7 2": 6,
    # Tier 7
    "i5-12": 7, "i7-10": 7, "i7-11": 7, "ryzen 5 5": 7, "ryzen 7 3": 7,
    # Tier 8
    "i5-13": 8, "i7-12": 8, "i9-9": 8, "i9-10": 8, "ryzen 7 5": 8, "ryzen 9 3": 8,
    # Tier 9
    "i7-13": 9, "i7-14": 9, "i9-11": 9, "i9-12": 9, "ryzen 7 7": 9, "ryzen 9 5": 9,
    # Tier 10 - latest flagships
    "i9-13": 10, "i9-14": 10, "i9-15": 10, "ryzen 9 7": 10, "ryzen 9 9": 10,
}


def tier_from_string(text: str, table: dict, default: int = 3) -> int:
    """Return the best-matching tier for a free-form CPU/GPU string."""
    if not text:
        return default
    t = text.lower().strip()
    # longest key first so 'rtx 3080 ti' beats 'rtx 3080'
    for key in sorted(table.keys(), key=len, reverse=True):
        if key in t:
            return table[key]
    return default


def gpu_tier(text: str) -> int:
    return tier_from_string(text, GPU_TIERS, default=3)


def cpu_tier(text: str) -> int:
    return tier_from_string(text, CPU_TIERS, default=4)


def infer_game_requirements(released_year: int | None, metacritic: int | None, genres: list[str]):
    """Rough heuristic to infer (min_cpu, rec_cpu, min_gpu, rec_gpu, min_ram, rec_ram)
    when RAWG doesn't give machine-readable specs.
    """
    year = released_year or 2015
    score = metacritic or 70
    genre_txt = " ".join(genres).lower()

    # Base tier by release year
    if year <= 2010:
        base_cpu, base_gpu = 1, 1
    elif year <= 2014:
        base_cpu, base_gpu = 2, 2
    elif year <= 2017:
        base_cpu, base_gpu = 3, 3
    elif year <= 2019:
        base_cpu, base_gpu = 4, 4
    elif year <= 2021:
        base_cpu, base_gpu = 5, 5
    elif year <= 2023:
        base_cpu, base_gpu = 6, 6
    else:
        base_cpu, base_gpu = 7, 7

    # Bump for demanding genres
    heavy = any(g in genre_txt for g in ["shooter", "action", "simulation", "racing"])
    if heavy:
        base_cpu += 1
        base_gpu += 1

    # Indie/Puzzle/Casual lower the bar
    light = any(g in genre_txt for g in ["indie", "puzzle", "casual", "card"])
    if light:
        base_cpu = max(1, base_cpu - 2)
        base_gpu = max(1, base_gpu - 2)

    # Acclaim nudges recommended higher
    if score >= 85:
        base_gpu += 1

    min_cpu = max(1, base_cpu - 1)
    rec_cpu = min(10, base_cpu + 1)
    min_gpu = max(1, base_gpu - 1)
    rec_gpu = min(10, base_gpu + 1)

    if year <= 2014:
        min_ram, rec_ram = 4, 8
    elif year <= 2019:
        min_ram, rec_ram = 8, 16
    else:
        min_ram, rec_ram = 8, 16 if not heavy else 16

    return {
        "min_cpu_tier": min_cpu,
        "rec_cpu_tier": rec_cpu,
        "min_gpu_tier": min_gpu,
        "rec_gpu_tier": rec_gpu,
        "min_ram_gb": min_ram,
        "rec_ram_gb": rec_ram,
    }


def score_rig_vs_game(user_cpu: str, user_gpu: str, user_ram: int, reqs: dict):
    """Return dict with verdict, score (0-100), bottleneck info."""
    uc = cpu_tier(user_cpu)
    ug = gpu_tier(user_gpu)

    def ratio(user, mn, rec):
        if user >= rec:
            return 1.0
        if user < mn:
            return max(0.0, user / mn * 0.5)
        span = max(1, rec - mn)
        return 0.5 + 0.5 * ((user - mn) / span)

    cpu_r = ratio(uc, reqs["min_cpu_tier"], reqs["rec_cpu_tier"])
    gpu_r = ratio(ug, reqs["min_gpu_tier"], reqs["rec_gpu_tier"])
    ram_r = ratio(user_ram, reqs["min_ram_gb"], reqs["rec_ram_gb"])

    score = int(round((cpu_r * 0.3 + gpu_r * 0.5 + ram_r * 0.2) * 100))
    score = max(0, min(100, score))

    if score >= 90:
        verdict = "Ultra"
    elif score >= 75:
        verdict = "High"
    elif score >= 55:
        verdict = "Medium"
    elif score >= 35:
        verdict = "Low"
    else:
        verdict = "Unplayable"

    # bottleneck = lowest ratio component
    parts = {"CPU": cpu_r, "GPU": gpu_r, "RAM": ram_r}
    bottleneck = min(parts, key=parts.get)

    return {
        "score": score,
        "verdict": verdict,
        "bottleneck": bottleneck,
        "breakdown": {
            "cpu": {"user_tier": uc, "min_tier": reqs["min_cpu_tier"], "rec_tier": reqs["rec_cpu_tier"], "ratio": round(cpu_r, 2)},
            "gpu": {"user_tier": ug, "min_tier": reqs["min_gpu_tier"], "rec_tier": reqs["rec_gpu_tier"], "ratio": round(gpu_r, 2)},
            "ram": {"user_gb": user_ram, "min_gb": reqs["min_ram_gb"], "rec_gb": reqs["rec_ram_gb"], "ratio": round(ram_r, 2)},
        },
    }
