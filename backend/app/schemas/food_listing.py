from datetime import datetime

from pydantic import BaseModel, Field

from ..models.food_listing import FoodType, ListingStatus


class ListingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    description: str | None = None
    quantity: str = Field(..., min_length=1, max_length=60)
    food_type: FoodType = FoodType.OTHER
    pickup_address: str = Field(..., min_length=3, max_length=200)
    expiry_date: datetime


class ListingUpdate(BaseModel):
    """
    Every field optional — a PUT that omits a field leaves it unchanged.
    The service applies only the keys the client actually sent.
    """
    title: str | None = Field(default=None, min_length=3, max_length=120)
    description: str | None = None
    quantity: str | None = Field(default=None, min_length=1, max_length=60)
    food_type: FoodType | None = None
    pickup_address: str | None = Field(default=None, min_length=3, max_length=200)
    expiry_date: datetime | None = None
    status: ListingStatus | None = None


class ListingResponse(BaseModel):
    id: str
    donor_id: str
    donor_name: str | None = None      # joined in by the service for display
    title: str
    description: str | None
    quantity: str
    food_type: FoodType
    pickup_address: str
    expiry_date: datetime
    status: ListingStatus
    is_expired: bool = False           # computed, never stored
    request_count: int = 0             # computed, never stored
    created_at: datetime
    updated_at: datetime
