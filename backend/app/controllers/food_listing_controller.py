from fastapi import APIRouter, Depends, Query, status

from ..core.jwt import get_current_user_id
from ..models.food_listing import FoodType, ListingStatus
from ..schemas.food_listing import ListingCreate, ListingResponse, ListingUpdate
from .dependencies import listing_service

router = APIRouter()


@router.get("/food", response_model=list[ListingResponse])
def list_food(
    search: str | None = Query(default=None, description="Free-text search"),
    food_type: FoodType | None = Query(default=None),
    status_filter: ListingStatus | None = Query(default=None, alias="status"),
    include_expired: bool = Query(default=False),
    _: str = Depends(get_current_user_id),
):
    """
    FR6 — browse and search listings.

    GET /api/food?search=rice&food_type=COOKED&status=AVAILABLE
    """
    listings = listing_service.search(
        query=search,
        food_type=food_type.value if food_type else None,
        status_filter=status_filter.value if status_filter else None,
        include_expired=include_expired,
    )
    return [listing_service.to_response(l) for l in listings]


@router.get("/food/mine", response_model=list[ListingResponse])
def list_my_food(user_id: str = Depends(get_current_user_id)):
    """A donor's own listings, including expired and reserved ones."""
    return [listing_service.to_response(l) for l in listing_service.list_by_donor(user_id)]


@router.get("/food/{listing_id}", response_model=ListingResponse)
def get_food(listing_id: str, _: str = Depends(get_current_user_id)):
    return listing_service.to_response(listing_service.get_or_404(listing_id))


@router.post("/food", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
def create_food(payload: ListingCreate, user_id: str = Depends(get_current_user_id)):
    """FR3 — Create Food Listing."""
    listing = listing_service.create(user_id, payload.model_dump())
    return listing_service.to_response(listing)


@router.put("/food/{listing_id}", response_model=ListingResponse)
def update_food(
    listing_id: str,
    payload: ListingUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """
    FR4 — Update Food Listing.

    exclude_unset=True is what makes a partial PUT work: keys the client
    never sent are absent from the patch, so those columns keep their
    current values instead of being overwritten with null.
    """
    patch = payload.model_dump(exclude_unset=True)
    listing = listing_service.update(listing_id, patch, user_id)
    return listing_service.to_response(listing)


@router.delete("/food/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_food(listing_id: str, user_id: str = Depends(get_current_user_id)):
    """FR5 — Delete Food Listing."""
    listing_service.delete(listing_id, user_id)
    return None
