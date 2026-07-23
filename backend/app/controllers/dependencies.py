"""
Shared wiring.

Every repository and service is constructed exactly once here and imported
by the controllers. Building them at module level in each controller instead
would give the auth controller a different UserRepository object than the
listing controller — harmless with file storage, but the kind of duplication
that turns into a real bug the moment caching or connection pooling appears.
"""
from ..repositories.food_listing_repository import FoodListingRepository
from ..repositories.notification_repository import NotificationRepository
from ..repositories.refresh_token_repository import RefreshTokenRepository
from ..repositories.request_repository import RequestRepository
from ..repositories.user_repository import UserRepository
from ..services.auth_service import AuthService
from ..services.food_listing_service import FoodListingService
from ..services.notification_service import NotificationService
from ..services.request_service import RequestService

# ── repositories ──────────────────────────────────────────────────────────────
user_repo = UserRepository()
listing_repo = FoodListingRepository()
request_repo = RequestRepository()
notification_repo = NotificationRepository()
refresh_token_repo = RefreshTokenRepository()

# ── services ──────────────────────────────────────────────────────────────────
notification_service = NotificationService(notification_repo)
auth_service = AuthService(user_repo, refresh_token_repo)
listing_service = FoodListingService(listing_repo, request_repo, user_repo)
request_service = RequestService(
    request_repo, listing_repo, user_repo, notification_service
)
