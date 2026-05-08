from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..utils.auth import get_current_user

router = APIRouter(tags=["Notifications"])


@router.get("/notifications", response_model=List[schemas.NotificationOut])
def get_notifications(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Notification)
        .filter(models.Notification.recipient_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.get("/notifications/unread-count")
def unread_count(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    count = (
        db.query(models.Notification)
        .filter(
            models.Notification.recipient_id == current_user.id,
            models.Notification.is_read == False,
        )
        .count()
    )
    return {"unread_count": count}


@router.post("/notifications/mark-all-read")
def mark_all_read(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    db.query(models.Notification).filter(
        models.Notification.recipient_id == current_user.id,
        models.Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.post("/notifications/{notif_id}/read")
def mark_one_read(
    notif_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    notif = db.query(models.Notification).filter(
        models.Notification.id == notif_id,
        models.Notification.recipient_id == current_user.id,
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Marked as read"}
