from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ---------- Auth ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = ""
    phone: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class OtpVerifyIn(BaseModel):
    email: EmailStr
    code: str


class OtpResendIn(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: str = ""
    role: str
    is_verified: bool


class AuthTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Products ----------
class ProductOut(BaseModel):
    id: str
    name: str
    slug: str
    price: float
    image: str
    images: List[str] = []
    description: str = ""
    club: str = ""
    league: str = ""
    era: str = ""
    year: str = ""
    player: str = ""
    tags: str = ""
    stock: Dict[str, int] = {}
    rating: float = 4.9
    reviews_count: int = 0
    is_active: bool = True
    is_trending: bool = False
    historical_campaign: Dict[str, Any] = {}


class ProductAdminIn(BaseModel):
    name: str
    price: float
    image: str = ""
    images: List[str] = []
    description: str = ""
    club: str = ""
    league: str = ""
    era: str = ""
    year: str = ""
    player: str = ""
    tags: str = ""
    stock: Dict[str, int] = {}
    is_active: bool = True
    is_trending: bool = False
    historical_campaign: Dict[str, Any] = {}


class ProductListOut(BaseModel):
    items: List[ProductOut]
    total: int
    page: int
    limit: int
    has_more: bool


class StockUpdateIn(BaseModel):
    stock: Dict[str, int]


# ---------- Cart ----------
class CartAddIn(BaseModel):
    product_id: str
    size: str = "M"
    qty: int = 1


class CartUpdateIn(BaseModel):
    product_id: str
    size: str
    qty: int


class CartItemOut(BaseModel):
    product_id: str
    size: str
    qty: int
    name: str
    image: str
    price: float


class CartOut(BaseModel):
    items: List[CartItemOut]
    subtotal: float


# ---------- Coupons ----------
class CouponValidateIn(BaseModel):
    code: str
    subtotal: float


class CouponValidateOut(BaseModel):
    valid: bool
    code: str = ""
    discount_type: str = ""
    discount_value: float = 0
    discount_amount: float = 0
    message: str = ""


class CouponAdminIn(BaseModel):
    code: str
    discount_type: str = "percent"
    discount_value: float
    expiry_type: str = "time"
    max_uses: Optional[int] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    min_order_value: float = 0
    is_active: bool = True


class CouponOut(BaseModel):
    id: str
    code: str
    discount_type: str
    discount_value: float
    expiry_type: str
    max_uses: Optional[int] = None
    used_count: int
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    min_order_value: float
    is_active: bool


# ---------- Orders ----------
class OrderItemIn(BaseModel):
    product_id: str
    size: str = "M"
    qty: int = 1


class OrderPlaceIn(BaseModel):
    items: List[OrderItemIn]
    phone: str
    shipping_address: Dict[str, Any]
    coupon_code: Optional[str] = None


class OrderItemOut(BaseModel):
    product_id: str
    product_name: str
    product_image: str = ""
    size: str
    qty: int
    price_at_purchase: float


class OrderOut(BaseModel):
    id: str
    tracking_id: str
    status: str
    subtotal: float
    discount: float
    total: float
    coupon_code: Optional[str] = None
    phone: str
    shipping_address: Dict[str, Any]
    payment_status: str
    payment_id: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut]


class OrderPhoneUpdateIn(BaseModel):
    phone: str


class OrderStatusUpdateIn(BaseModel):
    status: str


# ---------- Payments ----------
class PaymentCreateIn(BaseModel):
    order_id: str


class PaymentCreateOut(BaseModel):
    payment_id: str
    checkout_url: str
    status: str
    mocked: bool = True
