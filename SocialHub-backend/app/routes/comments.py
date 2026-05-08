from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..utils.auth import get_current_user

router = APIRouter(tags=["Comments"])


@router.post("/posts/{post_id}/comments", response_model=schemas.CommentOut)
def add_comment(
    post_id: int,
    body: schemas.CommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = models.Comment(
        content=body.content,
        user_id=current_user.id,
        post_id=post_id,
    )
    db.add(comment)

    # Notify post author (skip if commenting on own post)
    if post.user_id != current_user.id:
        notif = models.Notification(
            type="comment",
            message=f"{current_user.name} commented on your post",
            recipient_id=post.user_id,
            actor_id=current_user.id,
            post_id=post_id,
        )
        db.add(notif)

    db.commit()
    db.refresh(comment)
    return comment


@router.get("/posts/{post_id}/comments", response_model=List[schemas.CommentOut])
def get_comments(
    post_id: int,
    db: Session = Depends(database.get_db),
    _: dict = Depends(get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post.comments


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted"}
