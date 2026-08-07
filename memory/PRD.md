# KnitCult — Product Requirements Document

## Original problem statement
Build a football / soccer jersey e-commerce site with sign-in, home, catalog + search + filters, cart, and full checkout. Minimalist black-and-white aesthetic. Guest browsing allowed; email OTP verification required at checkout. Store name: **KnitCult**. Owner email: `support.knitcult@gmail.com`.

## Architecture (Feb 2026)
- **Frontend**: React + React Router + Tailwind + shadcn UI + sonner toasts
- **Backend**: FastAPI (single app, routers) served via supervisor at :8001, exposed via Kubernetes ingress under `/api/*`
- **DB**: MariaDB 10.11 (MySQL-compat) — data at `/app/data/mysql`, supervisor-managed
- **Cache/session**: Redis 8 — data at `/app/data/redis`, supervisor-managed  
- **Recommendations**: In-process weighted Jaccard on comma-separated tags with prefix weights (`category:5, club:4, league:3.5, player:3.5, era:3, brand:3, type:2.5, style:2, year:1.5, color:1`). Refreshed on admin writes + every 10 min.
- **Auth**: Custom JWT (HS256, 24h expiry) + bcrypt via passlib. Email OTP verification via Resend on first login/checkout.
- **Payments**: PhonePe **STUBBED** as instant mock success (see `/app/backend/routers/payments.py`). Real PhonePe v2 (OAuth-based `client_id/secret`) is not wired until credentials are provided.
- **Email**: Resend for OTP + order-placed customer & owner notifications. Sender configurable via `SENDER_EMAIL` env var.

## Personas
- **Collector (buyer)** — browses catalog, adds to cart as guest, signs up + verifies email during checkout, tracks orders, may update shipping phone while order is in transit.
- **Owner / Admin** — logs in with seeded admin creds, manages products (CRUD + stock), coupons (count- or time-expiry), reviews orders, updates order status.

## Core requirements (locked)
- Guest browsing / add-to-cart; auth required only at checkout.
- Cart backed by Redis for logged-in users; localStorage for guests; merged on sign-in.
- Coupons support two expiry modes: **count** (`max_uses`) or **time** (`valid_until`). One coupon per order, no stacking.
- Product model uses free-form comma-separated `tags` (e.g. `category:jersey,club:arsenal,player:henry,color:red`).
- Recommendation endpoint returns similar products sorted by weighted-Jaccard score.
- Orders send confirmation email to both buyer and owner.
- User can update phone number on their in-transit orders.
- Admin panel accessible at `/admin` (React) with tabs for Products / Coupons / Orders.

## Implemented (7 Feb 2026)
- ✅ MariaDB + Redis installed in pod, data persisted at `/app/data/`, supervisor configs at `/etc/supervisor/conf.d/mariadb.conf`. Bootstrap script at `/app/scripts/bootstrap-db.sh` for pod restarts.
- ✅ SQLAlchemy models: `users`, `otp_codes`, `products`, `orders`, `order_items`, `coupons`.
- ✅ JWT auth (`/api/auth/register`, `/login`, `/verify-otp`, `/resend-otp`, `/me`).
- ✅ Products list + detail + filters + sort (`/api/products`).
- ✅ Redis cart (`/api/cart/*`).
- ✅ Coupons validation (`/api/coupons/validate`) with count / time expiry logic.
- ✅ Orders placement, my-orders, phone update (`/api/orders/*`).
- ✅ Weighted-Jaccard recommendations (`/api/recommendations/{id}`).
- ✅ MOCK PhonePe payment (`/api/payments/create`, `/status/{id}`).
- ✅ Admin CRUD for products, coupons, order status, cache refresh (`/api/admin/*`).
- ✅ Email templates (OTP + order-placed customer + order-placed owner) via Resend.
- ✅ Seed script creates admin user + 8 seeded jerseys + 3 sample coupons (`FIRST10`, `COLLECTOR25`, `FLAT50`).
- ✅ React frontend fully rewired: real API-backed StoreContext, OTP-based Signin flow, ProductDetail with recommendations widget, Checkout with real order placement + coupon application, Orders page with phone-edit, Admin panel.
- ✅ Defensive validation added: qty > 0, price ≥ 0, coupon percent 0..100, count coupon needs max_uses ≥ 1, time coupon needs future valid_until, cart validates size + stock, order decrements stock.

## Deferred / P1 backlog
- Real PhonePe v2 integration (OAuth client_id/client_secret/webhook signature). Blocked on merchant credentials.
- SMS OTP for phone verification (Twilio).
- Product image upload UI in admin panel (currently URL-only).
- Wishlist persistence server-side (currently localStorage).
- Search-as-you-type with debounce + full-text index.
- Rate limiting on `/api/auth/*` via Redis.

## Key env vars (all in `/app/backend/.env`)
- `MYSQL_HOST / _PORT / _USER / _PASSWORD / _DATABASE`
- `REDIS_URL`
- `JWT_SECRET / _ALGORITHM / _EXPIRE_MINUTES`
- `RESEND_API_KEY / SENDER_EMAIL / OWNER_EMAIL`
- `ADMIN_EMAIL / ADMIN_PASSWORD` (used by seed script)
- `OTP_EXPIRE_MINUTES / OTP_MAX_ATTEMPTS`
- `FRONTEND_URL` (used in mock payment redirect)

## Test credentials
See `/app/memory/test_credentials.md`.

## Backend health status
- 21/27 backend tests passed on initial run.
- All 6 defensive validation failures fixed in follow-up patch.
