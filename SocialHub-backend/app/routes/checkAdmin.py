from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, database
from ..utils.auth import verify_token_only

router = APIRouter(prefix='/checkAdmin')


@router.get('/{savedEmail}')
def check_admin(
    savedEmail: str,
    db: Session = Depends(database.get_db),
    _: dict = Depends(verify_token_only),
):
    user = db.query(models.User).filter(models.User.email == savedEmail).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {'is_admin': user.role.lower() == 'admin'}
