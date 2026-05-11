from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routes import (
    auth, fetchUsers, delete_cookie, analytics_fetch,
    edit_user, likes_logic, checkAdmin, add_post,
    comments, follows, notifications
)
from .database import engine, Base
from . import models  # noqa: F401 — ensures all models are registered
import os

app = FastAPI(title="SocialHub API")

# Create uploads dir and all DB tables on startup
os.makedirs("uploads", exist_ok=True)
Base.metadata.create_all(bind=engine)

origins = [
    "https://socialhub.pxxl.xyz",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "https://socialhub-roan.vercel.app",
    "https://socialhub-y99d.onrender.com",
    "https://socialhub-backend-se80.onrender.com",
    "https://social-hub-frontend-kappa.vercel.app",
    "https://socialhub.pxxl.click",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Existing routers
app.include_router(auth.router)
app.include_router(fetchUsers.router)
app.include_router(add_post.router)
app.include_router(delete_cookie.router)
app.include_router(analytics_fetch.router)
app.include_router(edit_user.router)
app.include_router(likes_logic.router)
app.include_router(checkAdmin.router)

# New feature routers
app.include_router(comments.router)
app.include_router(follows.router)
app.include_router(notifications.router)
