from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.offer_model import Offer
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/history/{uuid}")
def get_user_history(uuid: str, db: Session = Depends(get_db)):
    offers = db.query(Offer).filter(Offer.uuid == uuid).order_by(Offer.timestamp.desc()).all()
    return [offer.__dict__ for offer in offers]