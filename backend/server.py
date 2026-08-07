import os
import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from database import Base, engine  # noqa: E402
import recommendations as rec_engine  # noqa: E402
from routers import auth as auth_router  # noqa: E402
from routers import products as products_router  # noqa: E402
from routers import cart as cart_router  # noqa: E402
from routers import orders as orders_router  # noqa: E402
from routers import coupons as coupons_router  # noqa: E402
from routers import recommendations as recommendations_router  # noqa: E402
from routers import payments as payments_router  # noqa: E402
from routers import admin as admin_router  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
log = logging.getLogger("server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Initial recommendation cache load
    try:
        await rec_engine.refresh_cache()
    except Exception as e:
        log.error("Initial recommendation cache load failed: %s", e)
    # Background refresh every 10 min
    refresh_task = asyncio.create_task(rec_engine.periodic_refresh(600))
    try:
        yield
    finally:
        refresh_task.cancel()


app = FastAPI(title="KnitCult API", lifespan=lifespan)

# Legacy status router (kept for backwards compat with template healthcheck)
legacy_router = APIRouter(prefix="/api")


@legacy_router.get("/")
async def root():
    return {"service": "KnitCult", "status": "ok"}


@legacy_router.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(legacy_router)
app.include_router(auth_router.router)
app.include_router(products_router.router)
app.include_router(cart_router.router)
app.include_router(orders_router.router)
app.include_router(coupons_router.router)
app.include_router(recommendations_router.router)
app.include_router(payments_router.router)
app.include_router(admin_router.router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
