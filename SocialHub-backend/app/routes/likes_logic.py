from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from ..models import Post, PostLike, User
from ..database import get_db
import os
from dotenv import load_dotenv

router = APIRouter()
load_dotenv()
SECRET_KEY = os.environ.get("SECRET_KEY")
ALGORITHM = "HS256"


# ------------------- LIKE / UNLIKE -------------------
@router.post("/posts/{post_id}/like")
def toggle_like(post_id: int, request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        post = db.query(Post).filter(Post.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")

        existing_like = (
            db.query(PostLike)
            .filter(PostLike.user_id == user.id, PostLike.post_id == post_id)
            .first()
        )

        if existing_like:
            db.delete(existing_like)
            post.likes = max(0, post.likes - 1)
            db.commit()
            return {"message": "Unliked", "likes": post.likes}
        else:
            new_like = PostLike(user_id=user.id, post_id=post_id)
            db.add(new_like)
            post.likes += 1
            db.commit()
            return {"message": "Liked", "likes": post.likes}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ------------------- CHECK IF LIKED -------------------
@router.get("/getLiked/{post_id}/liked")
def check_liked(post_id: int, request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        existing_like = (
            db.query(PostLike)
            .filter(PostLike.user_id == user.id, PostLike.post_id == post_id)
            .first()
        )

        return {"liked": bool(existing_like)}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
