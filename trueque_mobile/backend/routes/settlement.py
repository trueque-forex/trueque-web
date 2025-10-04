from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from models.offer_model import Offer  # Assuming you're updating Offer directly

router = APIRouter()

class SettlementRequest(BaseModel):
    tx_id: str
    user_id: str
    from_currency: str
    to_currency: str
    amount: float
    rate: float
    timestamp: datetime
    status: str
    confirmed_by_user_id: int

@router.post("/settle")
def settle_exchange(request: SettlementRequest, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.uuid == request.tx_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.status = request.status
    offer.settlement_timestamp = datetime.utcnow()
    offer.confirmed_by_user_id = request.confirmed_by_user_id
    db.commit()

    return {
        "message": "Settlement confirmed",
        "uuid": offer.uuid,
        "status": offer.status,
        "settlement_timestamp": offer.settlement_timestamp.isoformat(),
        "confirmed_by_user_id": offer.confirmed_by_user_id
    }