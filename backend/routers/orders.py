import secrets
import string
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Order, OrderItem, Product, Coupon, User
from schemas import (
    OrderPlaceIn,
    OrderOut,
    OrderItemOut,
    OrderPhoneUpdateIn,
)
from auth_utils import get_current_user
from redis_client import redis_client
from routers.coupons import _validate_coupon
from email_service import send_email, order_customer_html, order_owner_html
import os

router = APIRouter(prefix="/api/orders", tags=["orders"])

OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "")


def _tracking() -> str:
    return "KC-" + "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(10))


def _to_out(o: Order) -> OrderOut:
    return OrderOut(
        id=o.id,
        tracking_id=o.tracking_id,
        status=o.status,
        subtotal=o.subtotal,
        discount=o.discount,
        total=o.total,
        coupon_code=o.coupon_code or None,
        phone=o.phone,
        shipping_address=o.shipping_address or {},
        payment_status=o.payment_status,
        payment_id=o.payment_id or None,
        created_at=o.created_at,
        items=[
            OrderItemOut(
                product_id=i.product_id,
                product_name=i.product_name,
                product_image=i.product_image,
                size=i.size,
                qty=i.qty,
                price_at_purchase=i.price_at_purchase,
            )
            for i in o.items
        ],
    )


@router.post("", response_model=OrderOut)
async def place_order(
    body: OrderPlaceIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.is_verified:
        raise HTTPException(403, "Please verify your email before placing an order")
    if not body.items:
        raise HTTPException(400, "Order must contain at least one item")

    subtotal = 0.0
    order_items: list[OrderItem] = []
    for it in body.items:
        p = db.query(Product).filter(Product.id == it.product_id, Product.is_active == True).first()  # noqa
        if not p:
            raise HTTPException(400, f"Product {it.product_id} not available")
        line_total = p.price * it.qty
        subtotal += line_total
        order_items.append(
            OrderItem(
                product_id=p.id,
                product_name=p.name,
                product_image=p.image,
                size=it.size,
                qty=it.qty,
                price_at_purchase=p.price,
            )
        )

    discount = 0.0
    coupon_obj: Coupon | None = None
    if body.coupon_code:
        coupon_obj = db.query(Coupon).filter(Coupon.code == body.coupon_code.upper()).first()
        valid, msg, disc = _validate_coupon(coupon_obj, subtotal)
        if not valid:
            raise HTTPException(400, msg)
        discount = disc

    total = round(subtotal - discount, 2)

    order = Order(
        tracking_id=_tracking(),
        user_id=user.id,
        status="pending",
        subtotal=round(subtotal, 2),
        discount=discount,
        total=total,
        coupon_code=coupon_obj.code if coupon_obj else None,
        phone=body.phone,
        shipping_address=body.shipping_address,
        payment_status="pending",
    )
    order.items = order_items
    db.add(order)

    if coupon_obj:
        coupon_obj.used_count += 1

    db.commit()
    db.refresh(order)

    # Clear cart on order placement
    redis_client.delete(f"cart:{user.id}")

    # Fire-and-forget emails
    try:
        await send_email(user.email, f"KnitCult order confirmed — {order.tracking_id}", order_customer_html(order))
        if OWNER_EMAIL:
            await send_email(OWNER_EMAIL, f"New order: {order.tracking_id}", order_owner_html(order, user.email))
    except Exception:
        pass

    return _to_out(order)


@router.get("", response_model=list[OrderOut])
def my_orders(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_to_out(o) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        # Try tracking id
        order = db.query(Order).filter(Order.tracking_id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if user.role != "admin" and order.user_id != user.id:
        raise HTTPException(403, "Not your order")
    return _to_out(order)


@router.put("/{order_id}/phone", response_model=OrderOut)
def update_phone(
    order_id: str,
    body: OrderPhoneUpdateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        order = db.query(Order).filter(Order.tracking_id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if user.role != "admin" and order.user_id != user.id:
        raise HTTPException(403, "Not your order")
    if order.status in ("delivered", "cancelled"):
        raise HTTPException(400, "Cannot update phone for a completed order")
    order.phone = body.phone
    db.commit()
    db.refresh(order)
    return _to_out(order)
