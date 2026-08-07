import json
import os

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User
from redis_client import redis_client
from schemas import (
    RegisterIn,
    LoginIn,
    OtpVerifyIn,
    OtpResendIn,
    AuthTokenOut,
    UserOut,
)
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    generate_otp,
    hash_otp,
    get_current_user,
)
from email_service import send_email, otp_email_html

router = APIRouter(prefix="/api/auth", tags=["auth"])

OTP_MINUTES = int(os.environ.get("OTP_EXPIRE_MINUTES", "10"))
OTP_MAX_ATTEMPTS = int(os.environ.get("OTP_MAX_ATTEMPTS", "5"))


def _otp_key(email: str) -> str:
    return f"otp:{email}"


async def _create_and_send_otp(email: str) -> str:
    code = generate_otp()
    payload = {"code_hash": hash_otp(code), "attempts": 0}
    # Overwriting the key naturally invalidates any previous unused OTP for
    # this email, and the TTL below handles expiry automatically -- no
    # manual "expires_at" bookkeeping or MySQL writes needed.
    redis_client.set(_otp_key(email), json.dumps(payload), ex=OTP_MINUTES * 60)
    await send_email(email, "Your KnitCult verification code", otp_email_html(code, OTP_MINUTES))
    return "sent"


@router.post("/register", response_model=UserOut)
async def register(body: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(400, "Email already registered")
    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        name=body.name,
        phone=body.phone,
        role="user",
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    await _create_and_send_otp(user.email)
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        role=user.role,
        is_verified=user.is_verified,
    )


@router.post("/login", response_model=AuthTokenOut)
async def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    # If not verified, send fresh OTP
    if not user.is_verified:
        await _create_and_send_otp(user.email)
        raise HTTPException(status_code=403, detail="Email not verified. A new OTP has been sent.")
    token = create_access_token(user.id)
    return AuthTokenOut(
        access_token=token,
        user=UserOut(
            id=user.id,
            email=user.email,
            name=user.name,
            phone=user.phone,
            role=user.role,
            is_verified=user.is_verified,
        ),
    )


@router.post("/verify-otp", response_model=AuthTokenOut)
async def verify_otp_endpoint(body: OtpVerifyIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(404, "User not found")

    key = _otp_key(body.email)
    raw = redis_client.get(key)
    if not raw:
        # Covers both "never requested" and "expired" -- Redis's TTL
        # already dropped the key by itself, no manual expiry check needed.
        raise HTTPException(400, "No active OTP. Please request a new one.")
    otp = json.loads(raw)

    if otp["attempts"] >= OTP_MAX_ATTEMPTS:
        redis_client.delete(key)
        raise HTTPException(400, "Too many attempts. Please request a new OTP.")

    if hash_otp(body.code) != otp["code_hash"]:
        otp["attempts"] += 1
        # Re-set with the remaining TTL preserved, so a wrong guess doesn't
        # grant extra time on the code.
        remaining_ttl = redis_client.ttl(key)
        redis_client.set(
            key, json.dumps(otp), ex=remaining_ttl if remaining_ttl and remaining_ttl > 0 else OTP_MINUTES * 60
        )
        raise HTTPException(400, f"Invalid code. {OTP_MAX_ATTEMPTS - otp['attempts']} attempts left.")

    redis_client.delete(key)
    user.is_verified = True
    db.commit()
    token = create_access_token(user.id)
    return AuthTokenOut(
        access_token=token,
        user=UserOut(
            id=user.id,
            email=user.email,
            name=user.name,
            phone=user.phone,
            role=user.role,
            is_verified=user.is_verified,
        ),
    )


@router.post("/resend-otp")
async def resend_otp(body: OtpResendIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.is_verified:
        raise HTTPException(400, "Already verified")
    await _create_and_send_otp(user.email)
    return {"status": "sent"}


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        role=user.role,
        is_verified=user.is_verified,
    )