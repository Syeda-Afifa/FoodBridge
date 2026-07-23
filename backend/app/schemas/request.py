from datetime import datetime

from pydantic import BaseModel, Field

from ..models.request import RequestStatus


class RequestCreate(BaseModel):
    listing_id: str
    message: str | None = Field(default=None, max_length=400)


class RequestUpdate(BaseModel):
    """
    Donors send APPROVED or REJECTED.
    Recipients send CANCELLED to withdraw their own request.
    The service enforces who is allowed to set what.
    """
    status: RequestStatus


class RequestResponse(BaseModel):
    id: str
    listing_id: str
    listing_title: str | None = None    # joined in for display
    recipient_id: str
    recipient_name: str | None = None
    donor_id: str | None = None
    message: str | None
    status: RequestStatus
    created_at: datetime
    updated_at: datetime
