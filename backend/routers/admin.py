import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Product, Coupon, Order, User
from schemas import (
    ProductOut,
    ProductAdminIn,
    StockUpdateIn,
    CouponOut,
    CouponAdminIn,
    OrderOut,
    OrderStatusUpdateIn,
)
from auth_utils import require_admin
from routers.products import _to_out as product_to_out
from routers.orders import _to_out as order_to_out
import recommendations as rec_engine

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", name).strip().lower()
    slug = re.sub(r"[\s-]+", "-", slug)
    return slug or "product"


def _normalize_tags(raw: str) -> str:
    tags = sorted({t.strip().lower() for t in (raw or "").split(",") if t.strip()})
    return ",".join(tags)


# ---------- Products ----------
@router.get("/products", response_model=list[ProductOut])
def list_all_products(admin=Depends(require_admin), db: Session = Depends(get_db)):
    products = db.query(Product).order_by(Product.created_at.desc()).all()
    return [product_to_out(p) for p in products]


@router.post("/products", response_model=ProductOut)
async def create_product(
    body: ProductAdminIn, admin=Depends(require_admin), db: Session = Depends(get_db)
):
    slug = _slugify(body.name)
    # Ensure unique slug
    base = slug
    idx = 1
    while db.query(Product).filter(Product.slug == slug).first():
        idx += 1
        slug = f"{base}-{idx}"
    p = Product(
        name=body.name,
        slug=slug,
        price=body.price,
        image=body.image,
        images=body.images,
        description=body.description,
        club=body.club,
        league=body.league,
        era=body.era,
        year=body.year,
        player=body.player,
        tags=_normalize_tags(body.tags),
        stock=body.stock,
        is_active=body.is_active,
        is_trending=body.is_trending,
        historical_campaign=body.historical_campaign,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    await rec_engine.refresh_cache()
    return product_to_out(p)


@router.put("/products/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    body: ProductAdminIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")
    p.name = body.name
    p.price = body.price
    p.image = body.image
    p.images = body.images
    p.description = body.description
    p.club = body.club
    p.league = body.league
    p.era = body.era
    p.year = body.year
    p.player = body.player
    p.tags = _normalize_tags(body.tags)
    p.stock = body.stock
    p.is_active = body.is_active
    p.is_trending = body.is_trending
    p.historical_campaign = body.historical_campaign
    db.commit()
    db.refresh(p)
    await rec_engine.refresh_cache()
    return product_to_out(p)


@router.patch("/products/{product_id}/stock", response_model=ProductOut)
def update_stock(
    product_id: str,
    body: StockUpdateIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")
    p.stock = body.stock
    db.commit()
    db.refresh(p)
    return product_to_out(p)


@router.delete("/products/{product_id}")
async def soft_delete_product(
    product_id: str, admin=Depends(require_admin), db: Session = Depends(get_db)
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")
    p.is_active = False
    db.commit()
    await rec_engine.refresh_cache()
    return {"status": "deleted", "id": product_id}


# ---------- Coupons ----------
def _coupon_out(c: Coupon) -> CouponOut:
    return CouponOut(
        id=c.id,
        code=c.code,
        discount_type=c.discount_type,
        discount_value=c.discount_value,
        expiry_type=c.expiry_type,
        max_uses=c.max_uses,
        used_count=c.used_count,
        valid_from=c.valid_from,
        valid_until=c.valid_until,
        min_order_value=c.min_order_value,
        is_active=c.is_active,
    )


@router.get("/coupons", response_model=list[CouponOut])
def list_coupons(admin=Depends(require_admin), db: Session = Depends(get_db)):
    coupons = db.query(Coupon).order_by(Coupon.created_at.desc()).all()
    return [_coupon_out(c) for c in coupons]


@router.post("/coupons", response_model=CouponOut)
def create_coupon(body: CouponAdminIn, admin=Depends(require_admin), db: Session = Depends(get_db)):
    code = body.code.upper().strip()
    if db.query(Coupon).filter(Coupon.code == code).first():
        raise HTTPException(400, "Coupon code already exists")
    if body.expiry_type not in ("count", "time"):
        raise HTTPException(400, "expiry_type must be 'count' or 'time'")
    if body.discount_type not in ("percent", "flat"):
        raise HTTPException(400, "discount_type must be 'percent' or 'flat'")
    if body.discount_type == "percent" and not (0 < body.discount_value <= 100):
        raise HTTPException(400, "Percent discount must be between 0 and 100")
    if body.expiry_type == "count" and (body.max_uses is None or body.max_uses < 1):
        raise HTTPException(400, "Count-based coupons require max_uses >= 1")
    if body.expiry_type == "time":
        if not body.valid_until:
            raise HTTPException(400, "Time-based coupons require valid_until")
        vu = body.valid_until.replace(tzinfo=timezone.utc) if body.valid_until.tzinfo is None else body.valid_until
        if vu <= datetime.now(timezone.utc):
            raise HTTPException(400, "valid_until must be in the future")
    c = Coupon(
        code=code,
        discount_type=body.discount_type,
        discount_value=body.discount_value,
        expiry_type=body.expiry_type,
        max_uses=body.max_uses,
        valid_from=body.valid_from,
        valid_until=body.valid_until,
        min_order_value=body.min_order_value,
        is_active=body.is_active,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return _coupon_out(c)


@router.put("/coupons/{coupon_id}", response_model=CouponOut)
def update_coupon(
    coupon_id: str, body: CouponAdminIn, admin=Depends(require_admin), db: Session = Depends(get_db)
):
    c = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not c:
        raise HTTPException(404, "Coupon not found")
    c.code = body.code.upper().strip()
    c.discount_type = body.discount_type
    c.discount_value = body.discount_value
    c.expiry_type = body.expiry_type
    c.max_uses = body.max_uses
    c.valid_from = body.valid_from
    c.valid_until = body.valid_until
    c.min_order_value = body.min_order_value
    c.is_active = body.is_active
    db.commit()
    db.refresh(c)
    return _coupon_out(c)


@router.delete("/coupons/{coupon_id}")
def delete_coupon(coupon_id: str, admin=Depends(require_admin), db: Session = Depends(get_db)):
    c = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not c:
        raise HTTPException(404, "Coupon not found")
    db.delete(c)
    db.commit()
    return {"status": "deleted", "id": coupon_id}


# ---------- Orders ----------
@router.get("/orders", response_model=list[OrderOut])
def list_all_orders(admin=Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return [order_to_out(o) for o in orders]


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: str,
    body: OrderStatusUpdateIn,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    allowed = {"pending", "processing", "in_transit", "delivered", "cancelled", "paid"}
    if body.status not in allowed:
        raise HTTPException(400, f"Invalid status. Allowed: {sorted(allowed)}")
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(404, "Order not found")
    o.status = body.status
    db.commit()
    db.refresh(o)
    return order_to_out(o)


# ---------- Cache ----------
@router.post("/cache/refresh")
async def refresh_recommendation_cache(admin=Depends(require_admin)):
    count = await rec_engine.refresh_cache()
    return {"status": "cache refreshed", "products_cached": count}
