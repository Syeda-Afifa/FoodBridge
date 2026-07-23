from fastapi import APIRouter, Depends, Query, status

from ..core.jwt import get_current_user_id
from ..schemas.request import RequestCreate, RequestResponse, RequestUpdate
from .dependencies import request_service

router = APIRouter()


@router.post("/requests", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(payload: RequestCreate, user_id: str = Depends(get_current_user_id)):
    """FR7 — Submit Food Request."""
    request = request_service.create(user_id, payload.listing_id, payload.message)
    return request_service.to_response(request)


@router.get("/requests", response_model=list[RequestResponse])
def list_requests(
    box: str = Query(default="sent", pattern="^(sent|received)$"),
    user_id: str = Depends(get_current_user_id),
):
    """
    Both sides of the conversation live at one URL, chosen by a query param:

      GET /api/requests?box=sent      → requests I submitted
      GET /api/requests?box=received  → requests on my listings
    """
    if box == "received":
        requests = request_service.list_received(user_id)
    else:
        requests = request_service.list_sent(user_id)
    return [request_service.to_response(r) for r in requests]


@router.put("/requests/{request_id}", response_model=RequestResponse)
def update_request(
    request_id: str,
    payload: RequestUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """FR8 — donor approves or rejects; recipient cancels."""
    request = request_service.update_status(request_id, payload.status.value, user_id)
    return request_service.to_response(request)
