# from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException 
# from sqlalchemy.orm import Session 
# from typing import Optional, List 
# import shutil, os
# # from pathlib import Path 
# from ..database import get_db 
# from ..models import User, Post as PostModel 
# from ..schemas import PostWithUsers as PostSchema

# router = APIRouter()
# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# # Upload post
# @router.post("/upload", response_model=PostSchema)
# async def upload_post(
#     email: str = Form(...),
#     content: str = Form(...),
#     tags: str = Form(""),
#     image: Optional[UploadFile] = File(None),
#     db: Session = Depends(get_db)
# ):
#     # Find user by email
#     user = db.query(User).filter(User.email == email).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")

#     # Handle image upload
#     file_path = None
#     if image:
#         allowed_extensions = ["jpg", "jpeg", "png"]
#         ext = image.filename.split(".")[-1].lower()
#         if ext not in allowed_extensions:
#             raise HTTPException(status_code=400, detail="Invalid image type. Only JPG/PNG allowed")

#         # Use the exact original file name
#         filename = image.filename
#         file_path = os.path.join(UPLOAD_DIR, filename).replace("\\", "/")

#         # Save image to uploads folder
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(image.file, buffer)

#     # Create post
#     new_post = PostModel(
#         content=content,
#         hashtags=tags,
#         image=file_path,
#         likes=0,
#         user_id=user.id
#     )

#     db.add(new_post)
#     # Update user's post count
#     user.posts += 1
#     db.commit()
#     db.refresh(new_post)

#     return new_post


# # Get all posts with user info
# @router.get("/getallposts", response_model=List[PostSchema])
# def get_posts(db: Session = Depends(get_db)):
#     posts = db.query(PostModel).all()
#     if not posts:
#         raise HTTPException(status_code=404, detail="User not found")
#     return posts




# @router.get("/getallpostsForUser/{savedEmail}", response_model=List[PostSchema])
# def get_posts(savedEmail: str, db: Session = Depends(get_db)):
#     # Step 1: Find the user by email
#     user = db.query(User).filter(User.email == savedEmail).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     # Step 2: Get all posts for that user's ID
#     posts = db.query(PostModel).filter(PostModel.user_id == user.id).all()
#     if not posts:
#         raise HTTPException(status_code=404, detail="Posts not found")
#     return posts



from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException,Request,status
from sqlalchemy.orm import Session 
from typing import Optional, List 
from ..database import get_db 
from ..models import User, Post as PostModel 
from ..schemas import PostWithUsers as PostSchema
import cloudinary
import cloudinary.uploader
from ..cloudinary_config import cloudinary  # import the config file
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
router = APIRouter()
load_dotenv()
SECRET_KEY =os.environ.get("SECRET_KEY") # in production use env vars
ALGORITHM = "HS256"

# Upload post
@router.post("/upload", response_model=PostSchema)
async def upload_post(
    request: Request,
    content: str = Form(...),
    tags: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.split(" ")[1]

    # Decode token to get user email
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
        )

    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Handle image upload
    image_url = None
    if image:
        allowed_extensions = ["jpg", "jpeg", "png"]
        ext = image.filename.split(".")[-1].lower()
        if ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Invalid image type. Only JPG/PNG allowed")

        upload_result = cloudinary.uploader.upload(
            image.file,
            folder="blog_posts",
            public_id=image.filename.split(".")[0],
            overwrite=True
        )
        image_url = upload_result.get("secure_url")

    # Create new post
    new_post = PostModel(
        content=content,
        hashtags=tags,
        image=image_url,
        likes=0,
        user_id=user.id
    )

    db.add(new_post)
    user.posts += 1
    db.commit()
    db.refresh(new_post)

    return new_post


# Get all posts with user info
@router.get("/getallposts", response_model=List[PostSchema])
def get_posts(db: Session = Depends(get_db)):
    posts = db.query(PostModel).all()
    return posts



@router.get("/getallpostsForUser", response_model=List[PostSchema])
def get_posts(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get('Authorization')  

    if not auth_header or not auth_header.startswith('Bearer '):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")

        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )

        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        posts = db.query(PostModel).filter(PostModel.user_id == user.id).all()
        if not posts:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No posts found for this user",
            )

        return posts

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired",
        )
    # Step 1: Find the user by email
    # user = db.query(User).filter(User.email == savedEmail).first()
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    
    # # Step 2: Get all posts for that user's ID
    # posts = db.query(PostModel).filter(PostModel.user_id == user.id).all()
    # if not posts:
    #     raise HTTPException(status_code=404, detail="Posts not found")
    
    # return posts
