from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from ..models import User, Post as PostModel
from ..schemas import PostWithUsers as PostSchema
from ..utils.auth import get_current_user, verify_token_only
import cloudinary.uploader
from ..cloudinary_config import cloudinary

router = APIRouter()


@router.post("/upload", response_model=PostSchema)
async def upload_post(
    content: str = Form(...),
    tags: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_url = None
    if image:
        ext = image.filename.split(".")[-1].lower()
        if ext not in ["jpg", "jpeg", "png"]:
            raise HTTPException(status_code=400, detail="Invalid image type. Only JPG/PNG allowed")

        result = cloudinary.uploader.upload(
            image.file,
            folder="blog_posts",
            public_id=image.filename.split(".")[0],
            overwrite=True,
        )
        image_url = result.get("secure_url")

    new_post = PostModel(
        content=content,
        hashtags=tags,
        image=image_url,
        likes=0,
        user_id=current_user.id,
    )
    db.add(new_post)
    current_user.posts += 1
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("/getallposts", response_model=List[PostSchema])
def get_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token_only),
):
    offset = (page - 1) * limit
    return (
        db.query(PostModel)
        .order_by(PostModel.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/getallpostsForUser", response_model=List[PostSchema])
def get_posts_for_user(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    offset = (page - 1) * limit
    return (
        db.query(PostModel)
        .filter(PostModel.user_id == current_user.id)
        .order_by(PostModel.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
