from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..utils.auth import verify_token_only

router = APIRouter(prefix="/users", tags=["Users"])


@router.get('/')
def fetch_users(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token_only),
):
    users = db.query(User).all()
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    return users


@router.get('/membersLength')
def fetch_members_length(
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token_only),
):
    members_length = db.query(User).filter(User.role == 'member').count()
    admin_length = db.query(User).filter(User.role == 'admin').count()
    return {
        'members': members_length,
        'admins': admin_length,
    }
