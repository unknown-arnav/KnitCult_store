from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc

from database import get_db
from models import Product
from schemas import ProductOut, ProductListOut

router = APIRouter(prefix="/api/products", tags=["products"])


def _to_out(p: Product) -> ProductOut:
    return ProductOut(
        id=p.id,
        name=p.name,
        slug=p.slug,
        price=p.price,
        image=p.image,
        images=p.images or [],
        description=p.description or "",
        club=p.club or "",
        league=p.league or "",
        era=p.era or "",
        year=p.year or "",
        player=p.player or "",
        tags=p.tags or "",
        stock=p.stock or {},
        rating=p.rating,
        reviews_count=p.reviews_count,
        is_active=p.is_active,
        is_trending=p.is_trending,
        historical_campaign=p.historical_campaign or {},
    )


@router.get("", response_model=ProductListOut)
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(24, ge=1, le=100),
    sort: str = Query("newest"),
    q: str | None = None,
    club: str | None = None,
    league: str | None = None,
    era: str | None = None,
    trending: bool | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Product).filter(Product.is_active == True)  # noqa
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                Product.name.like(like),
                Product.description.like(like),
                Product.club.like(like),
                Product.player.like(like),
                Product.tags.like(like),
            )
        )
    if club:
        query = query.filter(Product.club == club)
    if league:
        query = query.filter(Product.league == league)
    if era:
        query = query.filter(Product.era == era)
    if trending is not None:
        query = query.filter(Product.is_trending == trending)

    if sort == "price_low":
        query = query.order_by(asc(Product.price))
    elif sort == "price_high":
        query = query.order_by(desc(Product.price))
    elif sort == "rating":
        query = query.order_by(desc(Product.rating))
    else:
        query = query.order_by(desc(Product.created_at))

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return ProductListOut(
        items=[_to_out(p) for p in items],
        total=total,
        page=page,
        limit=limit,
        has_more=(page * limit) < total,
    )


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: str, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()  # noqa
    if not p:
        # Try slug lookup as fallback
        p = db.query(Product).filter(Product.slug == product_id, Product.is_active == True).first()  # noqa
    if not p:
        raise HTTPException(404, "Product not found")
    return _to_out(p)
