from datetime import datetime, timezone, timedelta
import os

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import User, OtpCode
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


async def _create_and_send_otp(db: Session, email: str) -> str:
    code = generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_MINUTES)
    # Invalidate previous unused otps for this email
    db.query(OtpCode).filter(OtpCode.email == email, OtpCode.used == False).update(  # noqa
        {"used": True}
    )
    otp = OtpCode(email=email, code_hash=hash_otp(code), expires_at=expires)
    db.add(otp)
    db.commit()
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
    await _create_and_send_otp(db, user.email)
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
        await _create_and_send_otp(db, user.email)
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
    otp = (
        db.query(OtpCode)
        .filter(OtpCode.email == body.email, OtpCode.used == False)  # noqa
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if not otp:
        raise HTTPException(400, "No active OTP. Please request a new one.")
    if otp.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(400, "OTP expired. Please request a new one.")
    if otp.attempts >= OTP_MAX_ATTEMPTS:
        otp.used = True
        db.commit()
        raise HTTPException(400, "Too many attempts. Please request a new OTP.")
    if hash_otp(body.code) != otp.code_hash:
        otp.attempts += 1
        db.commit()
        raise HTTPException(400, f"Invalid code. {OTP_MAX_ATTEMPTS - otp.attempts} attempts left.")
    otp.used = True
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
    await _create_and_send_otp(db, user.email)
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
