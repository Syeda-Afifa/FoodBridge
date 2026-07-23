from datetime import datetime, timezone
import uuid

from pydantic import BaseModel, Field


class Notification(BaseModel):
    """
    In-app notification (entity 4 in docs/18-erd.md).

    Written by the service layer whenever something happens that the other
    party should know about: a new request arrives, a request is approved
    or rejected. Read back by GET /api/notifications.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str                      # who should see this
    message: str
    link: str | None = None           # frontend route this notification points at
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
