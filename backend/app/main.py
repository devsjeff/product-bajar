import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.redis import get_redis, close_redis
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await get_redis()
    print(f"✅ {settings.APP_NAME} started")
    yield
    # Shutdown
    await close_redis()
    print(f"👋 {settings.APP_NAME} stopped")


app = FastAPI(
    title=settings.APP_NAME,
    description="""
## ProductBajar API

Offline store & product discovery platform.

### Features
- 🔍 **Search** products (spoon, cooker, etc.) — nearest first + top rating
- 🗺️ **Geo search** — PostGIS powered proximity queries
- 🏪 **Store management** — seller registration, product listing
- 🏷️ **Deals** — active offers, flash sales, old/past trip offers
- ⭐ **Reviews** — store ratings with recalculation
- 👤 **Auth** — JWT with refresh token rotation
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2)) + "ms"
    return response


# ─── Static file serving (local uploads) ─────────────────────────────────────

uploads_dir = settings.LOCAL_UPLOAD_DIR
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# ─── Routes ───────────────────────────────────────────────────────────────────

app.include_router(api_router)


@app.get("/", tags=["Health"])
async def root():
    return {"app": settings.APP_NAME, "status": "running", "version": "1.0.0"}


@app.get("/health", tags=["Health"])
async def health_check():
    try:
        r = await get_redis()
        await r.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    return {
        "status": "ok",
        "redis": "ok" if redis_ok else "error",
        "app": settings.APP_NAME,
    }


# ─── Exception Handlers ───────────────────────────────────────────────────────

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "Not found", "path": str(request.url)})


@app.exception_handler(500)
async def server_error_handler(request: Request, exc):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
