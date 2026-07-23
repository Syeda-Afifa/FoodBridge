"""
Application settings.

Values are read from environment variables, falling back to the defaults
below. In local development they come from backend/.env — copy
.env.example to .env and fill it in before running the server.
"""
from pathlib import Path

try:
    from pydantic_settings import BaseSettings
except Exception:  # pragma: no cover — pydantic v1 fallback
    from pydantic import BaseSettings


# Absolute path to backend/data — where the JSON "database" files live.
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    # ── Storage ───────────────────────────────────────────────────────────────
    # This project uses JSON files as its datastore so the app runs with zero
    # external setup. Every repository takes a file path, so swapping in
    # PostgreSQL or DynamoDB later means rewriting only the repository layer —
    # services and controllers stay untouched.
    USERS_FILE: str = str(DATA_DIR / "users.json")
    LISTINGS_FILE: str = str(DATA_DIR / "listings.json")
    REQUESTS_FILE: str = str(DATA_DIR / "requests.json")
    NOTIFICATIONS_FILE: str = str(DATA_DIR / "notifications.json")
    REFRESH_TOKENS_FILE: str = str(DATA_DIR / "refresh_tokens.json")

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "dev-only-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30

    # ── Refresh token ─────────────────────────────────────────────────────────
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7          # sliding window, resets on use
    REFRESH_TOKEN_ABSOLUTE_MAX_DAYS: int = 90   # hard limit, never extended

    # ── Password pepper ───────────────────────────────────────────────────────
    # Server-side secret mixed into every password before hashing.
    PASSWORD_PEPPER: str = "dev-only-pepper-change-me"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS_RAW: str = "http://localhost:5173,http://127.0.0.1:5173"

    # ── Cookie flags ──────────────────────────────────────────────────────────
    # secure=True requires HTTPS, and samesite="none" requires secure=True.
    # Local development runs on plain HTTP, so these default to relaxed
    # settings and are tightened via .env in production.
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS_RAW.split(",") if o.strip()]

    class Config:
        env_file = (".env", ".env.local")
        extra = "ignore"


settings = Settings()
