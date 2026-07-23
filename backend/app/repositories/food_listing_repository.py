from ..core.config import settings
from ..models.food_listing import FoodListing
from .json_repository import JSONRepository


class FoodListingRepository(JSONRepository[FoodListing]):
    def __init__(self, path: str | None = None):
        super().__init__(path or settings.LISTINGS_FILE, FoodListing)

    def list_by_donor(self, donor_id: str) -> list[FoodListing]:
        return self.find_by(donor_id=donor_id)

    def search(
        self,
        query: str | None = None,
        food_type: str | None = None,
        status: str | None = None,
    ) -> list[FoodListing]:
        """
        FR6 — Search Food Listings.

        Case-insensitive substring match across title, description, and
        pickup address, with optional food_type and status filters. A real
        database would push this into an index; here it is a linear scan,
        which is fine at the data volumes this project handles.
        """
        results = self.list_all()

        if query:
            needle = query.strip().lower()
            results = [
                listing for listing in results
                if needle in listing.title.lower()
                or needle in (listing.description or "").lower()
                or needle in listing.pickup_address.lower()
            ]

        if food_type:
            results = [l for l in results if l.food_type == food_type]

        if status:
            results = [l for l in results if l.status == status]

        return results
