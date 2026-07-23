from datetime import datetime, timezone
from enum import Enum
import uuid

from pydantic import BaseModel, Field


class ListingStatus(str, Enum):
    """
    Lifecycle of a listing.

    AVAILABLE — open for requests
    RESERVED  — a request was approved; hidden from the public browse list
    COMPLETED — food was collected
    CANCELLED — donor withdrew it
    """
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class FoodType(str, Enum):
    COOKED = "COOKED"
    RAW = "RAW"
    PACKAGED = "PACKAGED"
    BAKERY = "BAKERY"
    PRODUCE = "PRODUCE"
    OTHER = "OTHER"


class FoodListing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    donor_id: str
    title: str
    description: str | None = None
    quantity: str                     # free text, e.g. "12 meal boxes", "5 kg"
    food_type: FoodType = FoodType.OTHER
    pickup_address: str
    expiry_date: datetime
    status: ListingStatus = ListingStatus.AVAILABLE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        use_enum_values = True
