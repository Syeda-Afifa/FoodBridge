from datetime import datetime, timezone
from enum import Enum
import uuid

from pydantic import BaseModel, Field


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class FoodRequest(BaseModel):
    """
    A recipient asking a donor for a listing.

    Named FoodRequest rather than Request so it never collides with
    fastapi.Request in the controller layer.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    listing_id: str
    recipient_id: str
    message: str | None = None
    status: RequestStatus = RequestStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        use_enum_values = True
