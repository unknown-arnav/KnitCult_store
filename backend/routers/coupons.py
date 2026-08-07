from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Coupon
from schemas import CouponValidateIn, CouponValidateOut

router = APIRouter(prefix="/api/coupons", tags=["coupons"])


def _validate_coupon(coupon: Coupon | None, subtotal: float) -> tuple[bool, str, float]:
    """Returns (valid, message, discount_amount)."""
    if not coupon or not coupon.is_active:
        return False, "Coupon not found or inactive", 0.0
    if coupon.valid_from and coupon.valid_from.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        return False, "Coupon not yet active", 0.0
    if coupon.expiry_type == "time":
        if coupon.valid_until and coupon.valid_until.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            return False, "Coupon expired", 0.0
    if coupon.expiry_type == "count":
        if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
            return False, "Coupon has reached its usage limit", 0.0
    if subtotal < coupon.min_order_value:
        return False, f"Minimum order of ₹{coupon.min_order_value:.2f} required", 0.0
    if coupon.discount_type == "percent":
        discount = subtotal * (coupon.discount_value / 100.0)
    else:
        discount = coupon.discount_value
    discount = min(discount, subtotal)
    return True, "Coupon applied", round(discount, 2)


@router.post("/validate", response_model=CouponValidateOut)
def validate_coupon(body: CouponValidateIn, db: Session = Depends(get_db)):
    coupon = db.query(Coupon).filter(Coupon.code == body.code.upper()).first()
    valid, message, discount = _validate_coupon(coupon, body.subtotal)
    if not valid:
        return CouponValidateOut(valid=False, message=message)
    return CouponValidateOut(
        valid=True,
        code=coupon.code,
        discount_type=coupon.discount_type,
        discount_value=coupon.discount_value,
        discount_amount=discount,
        message=message,
    )
