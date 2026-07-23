from datetime import datetime, timedelta, timezone
import uuid

from pydantic import BaseModel, Field

from ..core.config import settings


def _now() -> datetime:
    return datetime.now(timezone.utc)


class RefreshToken(BaseModel):
    """
    A server-side session record.

    id         — the opaque random string handed to the browser as a cookie
    expires_at — sliding expiry, pushed forward each time the token is used
    absolute_expires_at — hard ceiling that is never extended, so a session
                          cannot live forever through constant refreshing
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    created_at: datetime = Field(default_factory=_now)
    expires_at: datetime = Field(
        default_factory=lambda: _now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    absolute_expires_at: datetime = Field(
        default_factory=lambda: _now() + timedelta(days=settings.REFRESH_TOKEN_ABSOLUTE_MAX_DAYS)
    )
