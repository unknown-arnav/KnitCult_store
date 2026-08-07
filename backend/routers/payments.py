import os
import uuid

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Order, User
from schemas import PaymentCreateIn, PaymentCreateOut
from auth_utils import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "").rstrip("/")


@router.post("/create", response_model=PaymentCreateOut)
def create_payment(
    body: PaymentCreateIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """MOCK PhonePe payment — instantly marks the order paid.
    Replace with real PhonePe integration when merchant credentials arrive.
    """
    order = db.query(Order).filter(Order.id == body.order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.user_id != user.id and user.role != "admin":
        raise HTTPException(403, "Not your order")
    if order.payment_status == "paid":
        return PaymentCreateOut(
            payment_id=order.payment_id or "",
            checkout_url=f"{FRONTEND_URL}/orders",
            status="paid",
            mocked=True,
        )

    payment_id = "MOCK_" + uuid.uuid4().hex[:16].upper()
    order.payment_id = payment_id
    order.payment_status = "paid"
    order.status = "processing"
    db.commit()

    return PaymentCreateOut(
        payment_id=payment_id,
        checkout_url=f"{FRONTEND_URL}/orders",
        status="paid",
        mocked=True,
    )


@router.get("/status/{order_id}")
def payment_status(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")
    if order.user_id != user.id and user.role != "admin":
        raise HTTPException(403, "Not your order")
    return {
        "order_id": order.id,
        "tracking_id": order.tracking_id,
        "payment_status": order.payment_status,
        "payment_id": order.payment_id or "",
        "status": order.status,
        "total": order.total,
        "mocked": True,
    }
