"""
FoodListingService — business rules for FR3, FR4, FR5, FR6.

The controller decides HTTP concerns (status codes, request parsing).
This layer decides what is actually allowed to happen, so the same rules
would still hold if the API were replaced with a CLI or a scheduled job.
"""
from datetime import datetime, timezone

from fastapi import HTTPException, status

from ..models.food_listing import FoodListing, ListingStatus
from ..repositories.food_listing_repository import FoodListingRepository
from ..repositories.request_repository import RequestRepository
from ..repositories.user_repository import UserRepository


def _as_aware(value: datetime) -> datetime:
    """
    Treat a naive datetime as UTC.

    Datetimes that round-trip through JSON sometimes lose their timezone,
    and comparing naive to aware raises TypeError in Python. Normalising in
    one helper keeps that bug out of every comparison below.
    """
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class FoodListingService:
    def __init__(
        self,
        repo: FoodListingRepository,
        request_repo: RequestRepository,
        user_repo: UserRepository,
    ):
        self.repo = repo
        self.requests = request_repo
        self.users = user_repo

    # ── read ─────────────────────────────────────────────────────────────────

    def search(
        self,
        query: str | None = None,
        food_type: str | None = None,
        status_filter: str | None = None,
        include_expired: bool = False,
    ) -> list[FoodListing]:
        """FR6 — Search Food Listings, newest first."""
        results = self.repo.search(query=query, food_type=food_type, status=status_filter)

        if not include_expired:
            now = datetime.now(timezone.utc)
            results = [l for l in results if _as_aware(l.expiry_date) > now]

        return sorted(results, key=lambda l: _as_aware(l.created_at), reverse=True)

    def list_by_donor(self, donor_id: str) -> list[FoodListing]:
        return sorted(
            self.repo.list_by_donor(donor_id),
            key=lambda l: _as_aware(l.created_at),
            reverse=True,
        )

    def get_or_404(self, listing_id: str) -> FoodListing:
        listing = self.repo.get(listing_id)
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing not found",
            )
        return listing

    # ── write ────────────────────────────────────────────────────────────────

    def create(self, donor_id: str, payload: dict) -> FoodListing:
        """FR3 — Create Food Listing."""
        expiry = _as_aware(payload["expiry_date"])
        if expiry <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expiry date must be in the future",
            )

        listing = FoodListing(donor_id=donor_id, **payload)
        return self.repo.create(listing)

    def update(self, listing_id: str, patch: dict, user_id: str) -> FoodListing:
        """FR4 — Update Food Listing. Only the owning donor may edit."""
        listing = self.get_or_404(listing_id)
        self._assert_owner(listing, user_id)

        if "expiry_date" in patch and patch["expiry_date"] is not None:
            if _as_aware(patch["expiry_date"]) <= datetime.now(timezone.utc):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Expiry date must be in the future",
                )

        patch["updated_at"] = datetime.now(timezone.utc)
        return self.repo.update(listing_id, patch)

    def delete(self, listing_id: str, user_id: str) -> None:
        """
        FR5 — Delete Food Listing.

        A listing with an approved request is not deleted outright, because
        a recipient may already be travelling to collect it. It is cancelled
        instead, which keeps the audit trail intact.
        """
        listing = self.get_or_404(listing_id)
        self._assert_owner(listing, user_id)

        approved = [
            r for r in self.requests.list_by_listing(listing_id)
            if r.status == "APPROVED"
        ]
        if approved:
            self.repo.update(
                listing_id,
                {
                    "status": ListingStatus.CANCELLED.value,
                    "updated_at": datetime.now(timezone.utc),
                },
            )
            return

        self.repo.delete(listing_id)

    # ── helpers ──────────────────────────────────────────────────────────────

    def _assert_owner(self, listing: FoodListing, user_id: str) -> None:
        if listing.donor_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only modify your own listings",
            )

    def to_response(self, listing: FoodListing) -> dict:
        """
        Enrich a stored listing with fields the UI needs but the database
        does not hold: the donor's display name, whether it has expired,
        and how many requests it has attracted.
        """
        donor = self.users.get(listing.donor_id)
        data = listing.model_dump()
        data["donor_name"] = donor.name if donor else None
        data["is_expired"] = _as_aware(listing.expiry_date) <= datetime.now(timezone.utc)
        data["request_count"] = len(self.requests.list_by_listing(listing.id))
        return data
