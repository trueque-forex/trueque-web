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

@router.get("/admin-dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    open_offers = db.query(Offer).filter(Offer.status == "open").count()
    matched_offers = db.query(Offer).filter(Offer.status == "matched").count()
    settled_offers = db.query(Offer).filter(Offer.status == "settled").count()

    latest_offer = db.query(Offer).order_by(Offer.timestamp.desc()).first()
    latest_time = latest_offer.timestamp if latest_offer else None

    return {
        "open": open_offers,
        "matched": matched_offers,
        "settled": settled_offers,
        "latest_offer_time": str(latest_time)
    }
