from ..core.config import settings
from ..models.notification import Notification
from .json_repository import JSONRepository


class NotificationRepository(JSONRepository[Notification]):
    def __init__(self, path: str | None = None):
        super().__init__(path or settings.NOTIFICATIONS_FILE, Notification)

    def list_by_user(self, user_id: str) -> list[Notification]:
        return self.find_by(user_id=user_id)
