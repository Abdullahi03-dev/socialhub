from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from .. import models, schemas, database
from ..utils.auth import verify_token_only

router = APIRouter()


@router.get("/top-users", response_model=list[schemas.UserBase])
def get_top_users(
    db: Session = Depends(database.get_db),
    _: dict = Depends(verify_token_only),
):
    user_ids = [u[0] for u in db.query(distinct(models.Post.user_id)).all()]
    return db.query(models.User).filter(models.User.id.in_(user_ids)).all()


@router.get("/top-hashtags")
def get_top_hashtags(
    db: Session = Depends(database.get_db),
    _: dict = Depends(verify_token_only),
):
    hashtags = (
        db.query(models.Post.hashtags)
        .order_by(models.Post.created_at.desc())
        .limit(5)
        .all()
    )
    return [h[0] for h in hashtags]
