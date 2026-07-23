from datetime import datetime, timezone
from enum import Enum
import uuid

from pydantic import BaseModel, Field


class Role(str, Enum):
    """
    FoodBridge roles (docs/03-stakeholder-analysis.md).

    DONOR     — restaurants, shops, households with surplus food
    RECIPIENT — NGOs, shelters, individuals collecting food
    ADMIN     — platform staff who moderate users and listings
    """
    DONOR = "DONOR"
    RECIPIENT = "RECIPIENT"
    ADMIN = "ADMIN"


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    hashed_password: str          # bcrypt hash (salt embedded) of password+pepper
    role: Role = Role.RECIPIENT
    phone: str | None = None
    organization: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        use_enum_values = True
