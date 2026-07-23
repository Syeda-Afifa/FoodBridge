from datetime import datetime

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    message: str
    link: str | None
    is_read: bool
    created_at: datetime
