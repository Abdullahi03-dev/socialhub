from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import shutil, os
from .. import models, database
from ..utils.auth import get_current_user

router = APIRouter(prefix='/edit', tags=['Edit'])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class UserUpdate(BaseModel):
    name: str
    bio: str
    location: str


@router.put("/editUser/{user_id}")
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if db_user.email != current_user.email:
        raise HTTPException(status_code=403, detail="Not authorized to edit this user")

    db_user.name = user.name
    db_user.bio = user.bio
    db_user.location = user.location
    db.commit()
    db.refresh(db_user)

    return {"message": "User updated successfully", "user": db_user}


@router.put("/editImage/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename).replace("\\", "/")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    current_user.image = file_path
    db.commit()
    db.refresh(current_user)

    return {"message": "Image uploaded successfully", "path": current_user.image}
