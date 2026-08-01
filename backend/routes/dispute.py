# backend/routes/dispute.py
#
# Dispute flagging for open offers.
# User identity read from JWT (GEMINI.md §5). Offer ownership checked via
# owner_id — never user_id (GEMINI.md §2.2).
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.database import get_db
from backend.models.offer_model import Offer
from backend.models.user import User          # was: backend.models.user_model (ghost)
from backend.utils.pin_utils import verify_pin
from pydantic import BaseModel

router = APIRouter()


class DisputeRequest(BaseModel):
    offer_id: int
    pin: str
    reason: str | None = None  # Optional reason for audit trail


@router.post("/dispute")
def flag_dispute(
    request: DisputeRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Flag an offer as disputed. Only the offer's owner may dispute it.
    PIN is required to authorize the action.
    """
    from backend.routes.kyc import _get_owner_id_from_token
    owner_id = _get_owner_id_from_token(authorization)

    offer = db.query(Offer).filter(Offer.id == request.offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Verify offer belongs to the authenticated user (owner_id, not user_id — §2.2)
    if str(offer.owner_id) != str(owner_id):
        raise HTTPException(status_code=403, detail="You do not own this offer")

    user = db.query(User).filter(User.id == owner_id).first()
    if not user or not user.pin_hash:
        raise HTTPException(status_code=403, detail="PIN not set — please set a PIN before disputing")

    if not verify_pin(request.pin, user.pin_hash):
        raise HTTPException(status_code=403, detail="Invalid PIN")

    offer.status = "disputed"
    offer.dispute_reason = request.reason
    offer.dispute_timestamp = datetime.now(timezone.utc)
    db.commit()

    return {
        "offer_id": offer.id,
        "status": offer.status,
        "reason": offer.dispute_reason,
        "timestamp": offer.dispute_timestamp.isoformat(),
        "message": "Dispute flagged successfully",
    }