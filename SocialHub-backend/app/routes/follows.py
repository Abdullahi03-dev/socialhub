from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models, schemas, database
from ..utils.auth import get_current_user

router = APIRouter(tags=["Follows"])


@router.post("/users/{user_id}/follow")
def toggle_follow(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(models.Follow)
        .filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.followed_id == user_id,
        )
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Unfollowed", "is_following": False}
    else:
        follow = models.Follow(follower_id=current_user.id, followed_id=user_id)
        db.add(follow)
        notif = models.Notification(
            type="follow",
            message=f"{current_user.name} started following you",
            recipient_id=user_id,
            actor_id=current_user.id,
        )
        db.add(notif)
        db.commit()
        return {"message": "Followed", "is_following": True}


@router.get("/users/{user_id}/follow-status", response_model=schemas.FollowStatus)
def follow_status(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    is_following = (
        db.query(models.Follow)
        .filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.followed_id == user_id,
        )
        .first()
        is not None
    )

    followers_count = db.query(models.Follow).filter(models.Follow.followed_id == user_id).count()
    following_count = db.query(models.Follow).filter(models.Follow.follower_id == user_id).count()

    return {
        "is_following": is_following,
        "followers_count": followers_count,
        "following_count": following_count,
    }


@router.get("/feed")
def personalized_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    offset = (page - 1) * limit
    followed_ids = [
        f.followed_id
        for f in db.query(models.Follow)
        .filter(models.Follow.follower_id == current_user.id)
        .all()
    ]

    query = db.query(models.Post)
    if followed_ids:
        query = query.filter(models.Post.user_id.in_(followed_ids))

    posts = query.order_by(models.Post.created_at.desc()).offset(offset).limit(limit).all()
    return posts


@router.post("/users/{user_id}/follow")
def toggle_follow(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot follow yourself")

    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    existing = (
        db.query(models.Follow)
        .filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.followed_id == user_id,
        )
        .first()
    )

    if existing:
        db.delete(existing)
        db.commit()
        return {"message": "Unfollowed", "is_following": False}
    else:
        follow = models.Follow(follower_id=current_user.id, followed_id=user_id)
        db.add(follow)

        # Notify the followed user
        notif = models.Notification(
            type="follow",
            message=f"{current_user.name} started following you",
            recipient_id=user_id,
            actor_id=current_user.id,
        )
        db.add(notif)
        db.commit()
        return {"message": "Followed", "is_following": True}


@router.get("/users/{user_id}/follow-status", response_model=schemas.FollowStatus)
def follow_status(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    is_following = (
        db.query(models.Follow)
        .filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.followed_id == user_id,
        )
        .first()
        is not None
    )

    followers_count = (
        db.query(models.Follow).filter(models.Follow.followed_id == user_id).count()
    )
    following_count = (
        db.query(models.Follow).filter(models.Follow.follower_id == user_id).count()
    )

    return {
        "is_following": is_following,
        "followers_count": followers_count,
        "following_count": following_count,
    }


@router.get("/feed")
def personalized_feed(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Returns posts from users the current user follows, newest first."""
    followed_ids = [
        f.followed_id
        for f in db.query(models.Follow)
        .filter(models.Follow.follower_id == current_user.id)
        .all()
    ]

    if not followed_ids:
        # Fall back to all posts if not following anyone
        posts = (
            db.query(models.Post)
            .order_by(models.Post.created_at.desc())
            .limit(50)
            .all()
        )
    else:
        posts = (
            db.query(models.Post)
            .filter(models.Post.user_id.in_(followed_ids))
            .order_by(models.Post.created_at.desc())
            .limit(50)
            .all()
        )

    return posts
