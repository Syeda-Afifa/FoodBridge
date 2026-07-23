from fastapi import APIRouter, Depends, HTTPException

from ..core.jwt import get_current_user_id
from ..schemas.notification import NotificationResponse
from .dependencies import notification_service

router = APIRouter()


@router.get("/notifications", response_model=list[NotificationResponse])
def list_notifications(user_id: str = Depends(get_current_user_id)):
    return notification_service.list_for_user(user_id)


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: str, user_id: str = Depends(get_current_user_id)):
    notification = notification_service.mark_read(notification_id, user_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification
