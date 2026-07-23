from ..models.notification import Notification
from ..repositories.notification_repository import NotificationRepository


class NotificationService:
    """
    Thin service around the notification store.

    Other services depend on this one rather than on the repository directly,
    so the rule "every state change tells the affected party" stays in one
    place instead of being scattered across the codebase.
    """

    def __init__(self, repo: NotificationRepository):
        self.repo = repo

    def notify(self, user_id: str, message: str, link: str | None = None) -> Notification:
        return self.repo.create(
            Notification(user_id=user_id, message=message, link=link)
        )

    def list_for_user(self, user_id: str) -> list[Notification]:
        return sorted(
            self.repo.list_by_user(user_id),
            key=lambda n: n.created_at,
            reverse=True,
        )

    def mark_read(self, notification_id: str, user_id: str) -> Notification | None:
        notification = self.repo.get(notification_id)
        if not notification or notification.user_id != user_id:
            return None
        return self.repo.update(notification_id, {"is_read": True})
