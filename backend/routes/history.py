from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..models.offer_model import Offer
from backend.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/history/{uuid}")
def get_user_history_uuid(uuid: str, db: Session = Depends(get_db)):
    # Legacy/By-Transaction endpoint
    offers = db.query(Offer).filter(Offer.uuid == uuid).all()
    return [offer.__dict__ for offer in offers]

@router.get("/history/user/{user_id}")
def get_user_history(user_id: int, db: Session = Depends(get_db)):
    offers = db.query(Offer).filter(Offer.user_id == user_id).order_by(Offer.timestamp.desc()).all()
    # Serialize manually or use Pydantic response model if configured
    return [offer for offer in offers]