from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models import Post, PostLike, User, Notification
from ..database import get_db
from ..utils.auth import get_current_user

router = APIRouter()


@router.post("/posts/{post_id}/like")
def toggle_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    existing_like = (
        db.query(PostLike)
        .filter(PostLike.user_id == current_user.id, PostLike.post_id == post_id)
        .first()
    )

    if existing_like:
        db.delete(existing_like)
        post.likes = max(0, post.likes - 1)
        db.commit()
        return {"message": "Unliked", "likes": post.likes}
    else:
        db.add(PostLike(user_id=current_user.id, post_id=post_id))
        post.likes += 1

        # Notify post author (skip if liking own post)
        if post.user_id != current_user.id:
            notif = Notification(
                type="like",
                message=f"{current_user.name} liked your post",
                recipient_id=post.user_id,
                actor_id=current_user.id,
                post_id=post_id,
            )
            db.add(notif)

        db.commit()
        return {"message": "Liked", "likes": post.likes}


@router.get("/getLiked/{post_id}/liked")
def check_liked(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing_like = (
        db.query(PostLike)
        .filter(PostLike.user_id == current_user.id, PostLike.post_id == post_id)
        .first()
    )
    return {"liked": bool(existing_like)}
