from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend.models.offer_model import Offer
from backend.models.user_model import User
from backend.utils.pin_utils import verify_pin
from pydantic import BaseModel

router = APIRouter()

# 🔐 Request schema
class DisputeRequest(BaseModel):
    offer_id: int
    pin: str
    reason: str | None = None  # Optional reason for audit

@router.post("/dispute")
def flag_dispute(request: DisputeRequest, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == request.offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    user = db.query(User).filter(User.id == offer.user_id).first()
    if not user or not user.pin_hash:
        raise HTTPException(status_code=403, detail="PIN not set for user")

    if not verify_pin(request.pin, user.pin_hash):
        raise HTTPException(status_code=403, detail="Invalid PIN")

    offer.status = "disputed"
    offer.dispute_reason = request.reason
    offer.dispute_timestamp = datetime.utcnow()
    db.commit()

    return {
        "offer_id": offer.id,
        "status": offer.status,
        "reason": offer.dispute_reason,
        "timestamp": offer.dispute_timestamp.isoformat(),
        "message": "Dispute flagged successfully"
    }