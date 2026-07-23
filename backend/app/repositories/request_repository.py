from ..core.config import settings
from ..models.request import FoodRequest
from .json_repository import JSONRepository


class RequestRepository(JSONRepository[FoodRequest]):
    def __init__(self, path: str | None = None):
        super().__init__(path or settings.REQUESTS_FILE, FoodRequest)

    def list_by_recipient(self, recipient_id: str) -> list[FoodRequest]:
        """Requests this user has SENT."""
        return self.find_by(recipient_id=recipient_id)

    def list_by_listing(self, listing_id: str) -> list[FoodRequest]:
        return self.find_by(listing_id=listing_id)

    def list_by_listings(self, listing_ids: list[str]) -> list[FoodRequest]:
        """Requests RECEIVED across a donor's listings."""
        wanted = set(listing_ids)
        return [r for r in self.list_all() if r.listing_id in wanted]

    def find_active(self, listing_id: str, recipient_id: str) -> FoodRequest | None:
        """
        An open request from this recipient on this listing, if one exists.
        Used to block duplicate submissions.
        """
        for request in self.list_by_listing(listing_id):
            if request.recipient_id == recipient_id and request.status in ("PENDING", "APPROVED"):
                return request
        return None
