from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user_model import User
from backend.utils.pin_utils import hash_pin

router = APIRouter()

@router.post("/pin/setup")
def setup_pin(user_id: int, pin: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pin_hash = hash_pin(pin)
    db.commit()
    return {"status": "PIN set successfully"}