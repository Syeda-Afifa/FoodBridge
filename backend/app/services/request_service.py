"""
RequestService — business rules for FR7 (Submit Food Request) and
FR8 (Approve Food Request).

This is where the most interesting rules in FoodBridge live, because a
request touches two users and changes the state of a third object.
"""
from datetime import datetime, timezone

from fastapi import HTTPException, status

from ..models.food_listing import ListingStatus
from ..models.request import FoodRequest, RequestStatus
from ..repositories.food_listing_repository import FoodListingRepository
from ..repositories.request_repository import RequestRepository
from ..repositories.user_repository import UserRepository
from .notification_service import NotificationService


def _as_aware(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


class RequestService:
    def __init__(
        self,
        repo: RequestRepository,
        listing_repo: FoodListingRepository,
        user_repo: UserRepository,
        notifications: NotificationService,
    ):
        self.repo = repo
        self.listings = listing_repo
        self.users = user_repo
        self.notifications = notifications

    # ── create ───────────────────────────────────────────────────────────────

    def create(self, recipient_id: str, listing_id: str, message: str | None) -> FoodRequest:
        """
        FR7 — Submit Food Request.

        Four rules, each returning a distinct status code so the frontend can
        show a useful message rather than a generic failure:
          404 — the listing does not exist
          400 — you are the donor, or the listing is expired / not available
          409 — you already have an open request on this listing
        """
        listing = self.listings.get(listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        if listing.donor_id == recipient_id:
            raise HTTPException(
                status_code=400,
                detail="You cannot request your own listing",
            )

        if listing.status != ListingStatus.AVAILABLE.value:
            raise HTTPException(
                status_code=400,
                detail="This listing is no longer available",
            )

        if _as_aware(listing.expiry_date) <= datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400,
                detail="This listing has expired",
            )

        if self.repo.find_active(listing_id, recipient_id):
            raise HTTPException(
                status_code=409,
                detail="You already have an open request for this listing",
            )

        request = self.repo.create(
            FoodRequest(
                listing_id=listing_id,
                recipient_id=recipient_id,
                message=message,
            )
        )

        recipient = self.users.get(recipient_id)
        self.notifications.notify(
            user_id=listing.donor_id,
            message=f"{recipient.name if recipient else 'Someone'} requested \"{listing.title}\"",
            link=f"/listings/{listing_id}",
        )
        return request

    # ── read ─────────────────────────────────────────────────────────────────

    def list_sent(self, recipient_id: str) -> list[FoodRequest]:
        """Requests this user submitted."""
        return sorted(
            self.repo.list_by_recipient(recipient_id),
            key=lambda r: _as_aware(r.created_at),
            reverse=True,
        )

    def list_received(self, donor_id: str) -> list[FoodRequest]:
        """Requests submitted against this user's listings."""
        listing_ids = [l.id for l in self.listings.list_by_donor(donor_id)]
        if not listing_ids:
            return []
        return sorted(
            self.repo.list_by_listings(listing_ids),
            key=lambda r: _as_aware(r.created_at),
            reverse=True,
        )

    # ── update ───────────────────────────────────────────────────────────────

    def update_status(self, request_id: str, new_status: str, user_id: str) -> FoodRequest:
        """
        FR8 — Approve Food Request.

        Permission depends on which side you are on:
          the listing's donor  → APPROVED or REJECTED
          the recipient        → CANCELLED (withdraw your own request)

        Approving has three side effects, applied together so the data can
        never end up half-updated:
          1. the request becomes APPROVED
          2. the listing becomes RESERVED, so it stops appearing in browse
          3. every other pending request on that listing is auto-rejected,
             and each of those recipients is notified
        """
        request = self.repo.get(request_id)
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")

        listing = self.listings.get(request.listing_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        is_donor = listing.donor_id == user_id
        is_recipient = request.recipient_id == user_id

        if not (is_donor or is_recipient):
            raise HTTPException(
                status_code=403,
                detail="You are not involved in this request",
            )

        if new_status in (RequestStatus.APPROVED.value, RequestStatus.REJECTED.value):
            if not is_donor:
                raise HTTPException(
                    status_code=403,
                    detail="Only the donor can approve or reject a request",
                )
        elif new_status == RequestStatus.CANCELLED.value:
            if not is_recipient:
                raise HTTPException(
                    status_code=403,
                    detail="Only the recipient can cancel their own request",
                )
        else:
            raise HTTPException(status_code=400, detail="Unsupported status change")

        if request.status != RequestStatus.PENDING.value:
            raise HTTPException(
                status_code=409,
                detail=f"This request is already {request.status.lower()}",
            )

        now = datetime.now(timezone.utc)
        updated = self.repo.update(request_id, {"status": new_status, "updated_at": now})

        if new_status == RequestStatus.APPROVED.value:
            self.listings.update(
                listing.id,
                {"status": ListingStatus.RESERVED.value, "updated_at": now},
            )
            self._auto_reject_others(listing.id, request_id, listing.title, now)
            self.notifications.notify(
                user_id=request.recipient_id,
                message=f"Your request for \"{listing.title}\" was approved",
                link=f"/requests",
            )

        elif new_status == RequestStatus.REJECTED.value:
            self.notifications.notify(
                user_id=request.recipient_id,
                message=f"Your request for \"{listing.title}\" was declined",
                link=f"/requests",
            )

        elif new_status == RequestStatus.CANCELLED.value:
            self.notifications.notify(
                user_id=listing.donor_id,
                message=f"A request for \"{listing.title}\" was withdrawn",
                link=f"/listings/{listing.id}",
            )

        return updated

    def _auto_reject_others(
        self,
        listing_id: str,
        approved_request_id: str,
        listing_title: str,
        now: datetime,
    ) -> None:
        for other in self.repo.list_by_listing(listing_id):
            if other.id == approved_request_id:
                continue
            if other.status != RequestStatus.PENDING.value:
                continue
            self.repo.update(
                other.id,
                {"status": RequestStatus.REJECTED.value, "updated_at": now},
            )
            self.notifications.notify(
                user_id=other.recipient_id,
                message=f"\"{listing_title}\" was given to another recipient",
                link="/requests",
            )

    # ── presentation ─────────────────────────────────────────────────────────

    def to_response(self, request: FoodRequest) -> dict:
        listing = self.listings.get(request.listing_id)
        recipient = self.users.get(request.recipient_id)
        data = request.model_dump()
        data["listing_title"] = listing.title if listing else None
        data["donor_id"] = listing.donor_id if listing else None
        data["recipient_name"] = recipient.name if recipient else None
        return data
