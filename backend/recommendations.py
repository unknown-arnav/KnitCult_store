import asyncio
import logging
from typing import Dict, Set, List

from database import SessionLocal
from models import Product

TAG_WEIGHTS: Dict[str, float] = {
    "category": 5.0,
    "club": 4.0,
    "team": 4.0,
    "league": 3.5,
    "player": 3.5,
    "era": 3.0,
    "brand": 3.0,
    "type": 2.5,
    "style": 2.0,
    "year": 1.5,
    "color": 1.0,
    "colour": 1.0,
    "fit": 1.0,
}
DEFAULT_WEIGHT = 1.0

CACHE: Dict[str, Dict] = {}
log = logging.getLogger("recommendations")


def parse_tags(raw: str) -> Set[str]:
    return {t.strip().lower() for t in (raw or "").split(",") if t.strip()}


def _weight(tag: str) -> float:
    if ":" in tag:
        return TAG_WEIGHTS.get(tag.split(":", 1)[0], DEFAULT_WEIGHT)
    return DEFAULT_WEIGHT


def weighted_jaccard(a: Set[str], b: Set[str]) -> float:
    inter = a & b
    if not inter:
        return 0.0
    union = a | b
    inter_w = sum(_weight(t) for t in inter)
    union_w = sum(_weight(t) for t in union)
    return inter_w / union_w if union_w > 0 else 0.0


def refresh_cache_sync() -> int:
    global CACHE
    db = SessionLocal()
    try:
        rows = db.query(Product).filter(Product.is_active == True).all()  # noqa
        CACHE = {
            p.id: {
                "id": p.id,
                "name": p.name,
                "slug": p.slug,
                "price": p.price,
                "image": p.image,
                "club": p.club,
                "league": p.league,
                "year": p.year,
                "rating": p.rating,
                "tags": parse_tags(p.tags),
            }
            for p in rows
        }
        log.info("Recommendation cache refreshed: %d products", len(CACHE))
        return len(CACHE)
    finally:
        db.close()


async def refresh_cache() -> int:
    return await asyncio.to_thread(refresh_cache_sync)


def recommend(product_id: str, limit: int = 4) -> List[Dict]:
    if product_id not in CACHE:
        return []
    target_tags = CACHE[product_id]["tags"]
    scored: List[Dict] = []
    for pid, info in CACHE.items():
        if pid == product_id:
            continue
        score = weighted_jaccard(target_tags, info["tags"])
        if score > 0:
            item = {k: v for k, v in info.items() if k != "tags"}
            item["score"] = round(score, 3)
            scored.append(item)
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


async def periodic_refresh(interval_seconds: int = 600):
    while True:
        try:
            await asyncio.sleep(interval_seconds)
            await refresh_cache()
        except asyncio.CancelledError:
            break
        except Exception as e:
            log.error("Periodic refresh error: %s", e)
