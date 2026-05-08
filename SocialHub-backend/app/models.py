# from sqlalchemy import Column, Integer, String,DateTime,func,Text,ForeignKey
# from sqlalchemy.orm import relationship
# from datetime import datetime
# from . database import Base

# # -------------------------
# # User Model
# # -------------------------

# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String(255), nullable=False)
#     email = Column(String(255), unique=True, index=True, nullable=False)
#     password = Column(String(255), nullable=False)
#     image = Column(String(255), nullable=True)
#     bio=Column(String)
#     location=Column(String)
#     posts = Column(Integer, default=0)  # number of posts by user
#     role=Column(String)
#     created_at = Column(DateTime, default=datetime.utcnow)
 
#     user_posts = relationship("Post", back_populates="user")
#     likes_id = relationship("PostLike", back_populates="user")


# class Post(Base):
#     __tablename__ = "posts"

#     id = Column(Integer, primary_key=True, index=True)
#     content = Column(Text, nullable=False)
#     hashtags = Column(String(255), nullable=True)
#     image = Column(String(255), nullable=True)   # optional
#     likes = Column(Integer, default=0)           # likes count
#     created_at = Column(DateTime, default=datetime.utcnow)

#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     user = relationship("User", back_populates="user_posts")
#     likes_id = relationship("PostLike", back_populates="post")
    
    
# class PostLike(Base):
#     __tablename__ = "post_likes"
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(String, ForeignKey("users.email", ondelete="CASCADE"))
#     post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))

#     user = relationship("User", back_populates="likes_id")
#     post = relationship("Post", back_populates="likes_id")
    
    
    
    
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


# -------------------------
# User Model
# -------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    image = Column(String(255), nullable=True)
    bio = Column(String)
    location = Column(String)
    posts = Column(Integer, default=0)
    role = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_posts = relationship("Post", back_populates="user", cascade="all, delete")
    likes = relationship("PostLike", back_populates="user", cascade="all, delete")
    comments = relationship("Comment", back_populates="user", cascade="all, delete")
    notifications = relationship("Notification", foreign_keys="Notification.recipient_id", back_populates="recipient", cascade="all, delete")

    # Follow relationships
    following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower", cascade="all, delete")
    followers = relationship("Follow", foreign_keys="Follow.followed_id", back_populates="followed", cascade="all, delete")


# -------------------------
# Post Model
# -------------------------
class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    hashtags = Column(String(255), nullable=True)
    image = Column(String(255), nullable=True)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="user_posts")
    likes_rel = relationship("PostLike", back_populates="post", cascade="all, delete")
    comments = relationship("Comment", back_populates="post", cascade="all, delete", order_by="Comment.created_at")


# -------------------------
# PostLike Model
# -------------------------
class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes_rel")

    __table_args__ = (UniqueConstraint("user_id", "post_id", name="uq_user_post_like"),)


# -------------------------
# Comment Model
# -------------------------
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)

    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")


# -------------------------
# Follow Model
# -------------------------
class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    followed_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    followed = relationship("User", foreign_keys=[followed_id], back_populates="followers")

    __table_args__ = (UniqueConstraint("follower_id", "followed_id", name="uq_follow"),)


# -------------------------
# Notification Model
# -------------------------
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)   # "like", "comment", "follow"
    message = Column(String(255), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=True)

    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="notifications")
    actor = relationship("User", foreign_keys=[actor_id])
