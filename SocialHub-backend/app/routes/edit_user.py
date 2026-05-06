from fastapi import APIRouter, Depends, HTTPException, UploadFile, File,Request,status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import shutil, os
from jose import jwt,JWTError
from .. import models, database
from dotenv import load_dotenv



# -------------------------------
# EDIT ROUTER
# -------------------------------
# Handles updating user info and uploading images
router = APIRouter(prefix='/edit', tags=['Edit'])

load_dotenv()

SECRET_KEY =os.environ.get("SECRET_KEY")  # in production use env vars
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 360  # 6 hours validity
# -------------------------------
# SCHEMA FOR USER UPDATE
# -------------------------------
class UserUpdate(BaseModel):
    name: str
    bio: str
    location: str


# -------------------------------
# UPDATE USER INFO
# -------------------------------
@router.put("/editUser/{user_id}")
def update_user(user_id: int, user: UserUpdate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.name = user.name
    db_user.bio = user.bio
    db_user.location = user.location

    db.commit()
    db.refresh(db_user)

    return {"message": "User updated successfully", "user": db_user}



UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)  







# ALREADY A DEFAULT IMAGE BUT IF YOU WISH TO EDIT YOU CAN->
# UPLOAD USER PROFILE IMAGE
# -------------------------------
@router.put("/editImage/upload-image")
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
):
    # ✅ 1. Extract Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]

    try:
        # ✅ 2. Decode JWT to get email
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("email")

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        # ✅ 3. Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Invalid file type. Only images allowed.")

        # ✅ 4. Ensure upload directory exists
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # ✅ 5. Save file
        file_path = os.path.join(UPLOAD_DIR, file.filename).replace("\\", "/")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # ✅ 6. Update user's image in DB
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.image = file_path
        db.commit()
        db.refresh(user)

        return {"message": "Image uploaded successfully", "path": user.image}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

