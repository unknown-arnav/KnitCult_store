import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Product, User
from schemas import CartAddIn, CartUpdateIn, CartItemOut, CartOut
from auth_utils import get_current_user
from redis_client import redis_client

router = APIRouter(prefix="/api/cart", tags=["cart"])

CART_TTL = 60 * 60 * 24 * 7  # 7 days


def _cart_key(user_id: str) -> str:
    return f"cart:{user_id}"


def _read_cart(user_id: str) -> list[dict]:
    raw = redis_client.get(_cart_key(user_id))
    if not raw:
        return []
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _write_cart(user_id: str, items: list[dict]) -> None:
    redis_client.set(_cart_key(user_id), json.dumps(items), ex=CART_TTL)


def _hydrate(items: list[dict], db: Session) -> CartOut:
    if not items:
        return CartOut(items=[], subtotal=0.0)
    ids = list({i["product_id"] for i in items})
    products = {p.id: p for p in db.query(Product).filter(Product.id.in_(ids)).all()}
    out: list[CartItemOut] = []
    subtotal = 0.0
    for it in items:
        p = products.get(it["product_id"])
        if not p or not p.is_active:
            continue
        line = CartItemOut(
            product_id=p.id,
            size=it["size"],
            qty=it["qty"],
            name=p.name,
            image=p.image,
            price=p.price,
        )
        out.append(line)
        subtotal += p.price * it["qty"]
    return CartOut(items=out, subtotal=round(subtotal, 2))


@router.get("", response_model=CartOut)
def get_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _hydrate(_read_cart(user.id), db)


@router.post("/add", response_model=CartOut)
def add_to_cart(
    body: CartAddIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(Product).filter(Product.id == body.product_id, Product.is_active == True).first()  # noqa
    if not p:
        raise HTTPException(404, "Product not found")
    if body.qty <= 0:
        raise HTTPException(400, "Quantity must be positive")
    # Validate size and stock
    stock_map = p.stock or {}
    if stock_map and body.size not in stock_map:
        raise HTTPException(400, f"Size '{body.size}' not available. Available: {sorted(stock_map.keys())}")
    items = _read_cart(user.id)
    current_qty = 0
    for it in items:
        if it["product_id"] == body.product_id and it["size"] == body.size:
            current_qty = it["qty"]
            break
    available = stock_map.get(body.size, 0) if stock_map else 999
    if current_qty + body.qty > available:
        raise HTTPException(400, f"Only {available} in stock for size {body.size} (you already have {current_qty} in cart)")
    for it in items:
        if it["product_id"] == body.product_id and it["size"] == body.size:
            it["qty"] += body.qty
            break
    else:
        items.append({"product_id": body.product_id, "size": body.size, "qty": body.qty})
    _write_cart(user.id, items)
    return _hydrate(items, db)


@router.put("/update", response_model=CartOut)
def update_cart(
    body: CartUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = _read_cart(user.id)
    new_items = []
    for it in items:
        if it["product_id"] == body.product_id and it["size"] == body.size:
            if body.qty > 0:
                new_items.append({"product_id": body.product_id, "size": body.size, "qty": body.qty})
        else:
            new_items.append(it)
    _write_cart(user.id, new_items)
    return _hydrate(new_items, db)


@router.delete("/remove", response_model=CartOut)
def remove_from_cart(
    product_id: str,
    size: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = _read_cart(user.id)
    items = [it for it in items if not (it["product_id"] == product_id and it["size"] == size)]
    _write_cart(user.id, items)
    return _hydrate(items, db)


@router.delete("/clear", response_model=CartOut)
def clear_cart(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    redis_client.delete(_cart_key(user.id))
    return CartOut(items=[], subtotal=0.0)
