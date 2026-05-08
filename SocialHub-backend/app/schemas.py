# from pydantic import BaseModel, EmailStr
# # import enum
# # from typing import  List
# from typing import Optional
# from datetime import datetime


# # ---------- USER ----------
# class UserCreate(BaseModel):
#     name: str
#     email: str
#     password: str
#     # role:str
    
    

    
    
    
# class UserOut(BaseModel):
#     id: int
#     mame: str
#     email: str
#     role:str
#     posts:int
#     created_at: datetime

#     model_config={
#         "from-attributes": True
# }
    
    
# class PostBase(BaseModel):
#     content: str
#     likes:int
#     tags: Optional[str] = None

# class PostCreate(PostBase):
#     image: Optional[str] = None
#     email: str   # frontend sends email

# class Post(PostBase):
#     id: int
#     image: Optional[str] = None
#     created_at: datetime
#     user_id: int

#     model_config={
#         "from-attributes": True
# }
    
    
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# ── User Schemas ──────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    name: str
    email: str

class UserOut(UserBase):
    id: int
    name: str
    role: str
    image: Optional[str] = None

    model_config = {"from_attributes": True}


class Profile(BaseModel):
    id: int
    name: str
    email: EmailStr
    bio: Optional[str] = None
    image: Optional[str] = None
    location: Optional[str] = None
    posts: int
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class idRequest(BaseModel):
    id: int


# ── Comment Schemas ───────────────────────────────────────

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: int
    content: str
    created_at: datetime
    user: UserOut

    model_config = {"from_attributes": True}


# ── Post Schemas ──────────────────────────────────────────

class PostBase(BaseModel):
    content: str
    hashtags: Optional[str] = None

class PostCreate(PostBase):
    email: str

class Post(PostBase):
    id: int
    image: Optional[str] = None
    likes: int
    created_at: datetime

class PostWithUsers(PostBase):
    id: int
    image: Optional[str] = None
    likes: int
    created_at: datetime
    user: UserOut
    comments: List[CommentOut] = []
    comment_count: int = 0

    model_config = {"from_attributes": True}


# ── Follow Schemas ────────────────────────────────────────

class FollowStatus(BaseModel):
    is_following: bool
    followers_count: int
    following_count: int


# ── Notification Schemas ──────────────────────────────────

class NotificationOut(BaseModel):
    id: int
    type: str
    message: str
    is_read: bool
    created_at: datetime
    actor: UserOut
    post_id: Optional[int] = None

    model_config = {"from_attributes": True}
