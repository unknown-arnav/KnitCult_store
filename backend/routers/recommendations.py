from fastapi import APIRouter, HTTPException, Query

import recommendations as rec_engine
from schemas import ProductOut

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/{product_id}")
def get_recommendations(product_id: str, limit: int = Query(4, ge=1, le=20)):
    items = rec_engine.recommend(product_id, limit)
    return {"product_id": product_id, "items": items}
