# from fastapi import APIRouter, Depends, HTTPException, Cookie, Query, Request
# from sqlalchemy.orm import Session
# from passlib.context import CryptContext
# from fastapi.responses import JSONResponse
# from jose import jwt, JWTError
# from datetime import datetime, timedelta, timezone
# from .. import schemas, models, database

# # AUTH ROUTER
# router = APIRouter(prefix="/auth", tags=["Auth"])

# # -----------------------------------
# # PASSWORD HASHING CONFIGURATION
# # -----------------------------------
# # Argon2 is secure but heavy — pre-initialize context once (global)
# pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# def get_password_hash(password: str):
#     # avoid reinitializing pwd_context each time
#     return pwd_context.hash(password)

# def verify_password(plain_password: str, hashed_password: str):
#     return pwd_context.verify(plain_password, hashed_password)


# # -----------------------------------
# # SIGNUP ENDPOINT
# # -----------------------------------
# @router.post('/signup')
# async def SignUp(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
#     # use .first() minimally, with .exists() check for speed
#     exists = db.query(models.User.id).filter(models.User.email == user.email).first()
#     if exists:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     hashed_password = get_password_hash(user.password)
#     new_user = models.User(
#         name=user.name,
#         email=user.email,
#         password=hashed_password,
#         role='member',
#         posts=0,
#         created_at=datetime.utcnow()
#     )
#     db.add(new_user)
#     db.commit()
#     db.refresh(new_user)
#     return {"msg": "User created successfully"}


# # -----------------------------------
# # SIMPLE TEST ENDPOINT
# # -----------------------------------
# @router.post('/testing')
# def testing():
#     print('hello')


# # -----------------------------------
# # JWT CONFIGURATION
# # -----------------------------------
# SECRET_KEY = "supersecret"
# ALGORITHM = "HS256"
# ACCESS_TOKEN_EXPIRE_MINUTES = 3600  # token validity in minutes


# # -----------------------------------
# # SIGNIN ENDPOINT
# # -----------------------------------
# @router.post("/signin")
# def signin(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
#     db_user = db.query(models.User).filter(models.User.email == user.email).first()
#     if not db_user or not verify_password(user.password, db_user.password):
#         raise HTTPException(status_code=401, detail="Invalid credentials")

#     expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

#     # Keep payload small (less decoding overhead)
#     token_data = {
#         "id": int(db_user.id),
#         "email": db_user.email,
#         "role": db_user.role,
#         "exp": int(expire.timestamp())
#     }

#     # JWT encoding is fast but CPU-based; avoid reimport each call
#     token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

#     response = JSONResponse({"msg": "Login successful"})
#     response.set_cookie(
#         key="access_token",
#         value=token,
#         httponly=True,
#         samesite="none",
#         secure=True,
#         max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
#         expires=int(expire.timestamp()),
#         path="/",
#     )
#     return response


# # -----------------------------------
# # FETCH USER BY EMAIL

# @router.get('/fetchbyemail')
# def get_user_by_email(email: str = Query(...), db: Session = Depends(database.get_db)):
#     # """
#     # Fetch user by email (query parameter), excluding password.
#     # """
#     user = db.query(models.User).filter(models.User.email == email).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
#     return user


# # -----------------------------------
# # CHECK AUTH (TOKEN VALIDATION)
# # -----------------------------------
# @router.get("/check-auth")
# def check_auth(access_token: str = Cookie(None)):
#     if not access_token:
#         return {"authenticated": False}
#     try:
#         # decoding only once — minimal cost
#         jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
#         return {"authenticated": True}
#     except JWTError:
#         return {"authenticated": False}


# # -----------------------------------
# # GET CURRENT LOGGED-IN USER
# # -----------------------------------
# @router.get("/details", response_model=schemas.Profile)
# def me(request: Request, db: Session = Depends(database.get_db)):
#     try:
#         token = request.cookies.get("access_token")
#         if not token:
#             raise HTTPException(status_code=401, detail="Not authenticated")

#         try:
#             payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         except JWTError:
#             raise HTTPException(status_code=401, detail="Invalid or expired token")

#         user_id = payload.get("id")
#         if not user_id:
#             raise HTTPException(status_code=401, detail="Invalid token payload")

#         try:
#             user_id = int(user_id)
#         except (ValueError, TypeError):
#             raise HTTPException(status_code=401, detail="Invalid token subject")

#         # fetch only columns you need (avoid fetching heavy relationships)
#         user = db.query(
#             models.User.id,
#             models.User.name,
#             models.User.email,
#             models.User.role,
#             models.User.posts,
#             models.User.created_at
#         ).filter(models.User.id == user_id).first()

#         if not user:
#             raise HTTPException(status_code=404, detail="User not found")

#         return user

#     except HTTPException:
#         raise
#     except Exception as e:
#         print("Error in /details:", str(e))
#         raise HTTPException(status_code=500, detail="Internal server error")




from fastapi import APIRouter, Depends, HTTPException, Header,Request
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from .. import schemas, models, database
import os
from dotenv import load_dotenv
router = APIRouter(prefix="/auth", tags=["Auth"])
load_dotenv()
# -----------------------------
# CONFIG
# -----------------------------
SECRET_KEY =os.environ.get("SECRET_KEY") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 360  # 6 hours validity

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# -----------------------------
# Password Helpers
# -----------------------------
def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


# -----------------------------
# JWT Helpers
# -----------------------------
def create_access_token(data: dict, expires_delta: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# -----------------------------
# SIGNUP
# -----------------------------
@router.post("/signup")
async def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password,
        role="member",
        posts=0,
        created_at=datetime.utcnow(),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User created successfully"}


# -----------------------------
# SIGNIN
# -----------------------------
@router.post("/signin")
def signin(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # create JWT
    token = create_access_token({
        "id": db_user.id,
        "email": db_user.email,
        "role": db_user.role
    })

    # send token back to frontend
    return {
        "msg": "Login successful",
        "access_token": token,
        "token_type": "bearer"
    }




# # -----------------------------------
# # FETCH USER BY EMAIL

@router.get('/fetchbyemail')
def get_user_by_email(request:Request, db: Session = Depends(database.get_db)):
    auth_header=request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return {'Message': 'Error, No token'}
    token = auth_header.split(" ")[1]
    try:
        email=jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.query(models.User).filter(models.User.email == email['email']).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError:
        return {"authenticated": False}

    # """
    # Fetch user by email (query parameter), excluding password.
    # """
    # user = db.query(models.User).filter(models.User.email == email).first()
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    # return user



# -----------------------------
# FETCH USER BY TOKEN
# -----------------------------
@router.get("/me")
def get_current_user(authorization: str = Header(...), db: Session = Depends(database.get_db)):
    """
    Example: Authorization: Bearer <token>
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ")[1]
    payload = decode_token(token)
    email = payload.get("email")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "posts": user.posts,
        "created_at": user.created_at,
    }


# -----------------------------
# Example Protected Route
# -----------------------------
@router.get("/protected")
def protected(authorization: str = Header(...)):
    """
    Test route — will fail if token invalid
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ")[1]
    payload = decode_token(token)

    return {"msg": f"Welcome {payload.get('email')}!", "data": payload}


@router.get("/check-auth")
def check_auth(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return {"authenticated": False}
    token = auth_header.split(" ")[1]
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"authenticated": True}
    except JWTError:
        return {"authenticated": False}
