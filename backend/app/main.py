"""
FoodBridge API — application entry point.

Layering (identical in spirit to the Smart Todo reference project):

    controllers/  HTTP only — parse the request, pick a status code
         │
    services/     business rules — who may do what, and what else changes
         │
    repositories/ storage only — read and write rows
         │
    models/       what a row looks like

Each layer talks only to the one directly below it. That is what makes it
possible to swap JSON files for PostgreSQL by rewriting one folder.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .controllers.auth_controller import router as auth_router
from .controllers.food_listing_controller import router as food_router
from .controllers.notification_controller import router as notification_router
from .controllers.request_controller import router as request_router
from .core.config import settings

app = FastAPI(
    title="FoodBridge API",
    description="Connecting surplus food donors with recipients before it expires.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_origins cannot be ["*"] while allow_credentials=True — browsers reject
# that combination, and credentials are required for the httpOnly refresh
# cookie. So the allowed origins are listed explicitly via CORS_ORIGINS_RAW.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Set-Cookie"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(food_router, prefix="/api", tags=["food listings"])
app.include_router(request_router, prefix="/api", tags=["requests"])
app.include_router(notification_router, prefix="/api", tags=["notifications"])


@app.get("/api/health", tags=["health"])
def health():
    """Liveness probe — also a quick way to confirm the server is running."""
    return {"status": "ok", "service": "foodbridge-api"}
