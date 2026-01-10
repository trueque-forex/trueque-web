from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import uuid

from ..models.offer_model import Offer
from ..database import get_db
from ..schemas.offer_schema import OfferCreate

router = APIRouter(prefix="/api/offers", tags=["Offers"])

# Simple in-memory Redis simulation for Idempotency
# Key: idempotency_key_str -> Value: {response: dict, expiry: datetime}
IDEMPOTENCY_CACHE = {}

@router.post("/create")
def create_offer(
    offer_in: OfferCreate, 
    db: Session = Depends(get_db),
    idempotency_key: str = Header(None, alias="Idempotency-Key")
):
    # 1. Idempotency Guard
    if idempotency_key:
        cached = IDEMPOTENCY_CACHE.get(idempotency_key)
        if cached:
            # Check expiry (24h)
            if datetime.now(timezone.utc) < cached['expiry']:
                print(f"Idempotency Hit: {idempotency_key}")
                return cached['response']
            else:
                del IDEMPOTENCY_CACHE[idempotency_key] # Expired

    try:
        # Generate a proper UUID for the offer/transaction
        tx_uuid = f"TX-{uuid.uuid4()}"
        
        new_offer = Offer(
            user_id=offer_in.user_id,
            uuid=tx_uuid,
            country=offer_in.country,
            currency_from=offer_in.currency_from,
            currency_to=offer_in.currency_to,
            amount_from=offer_in.amount,
            amount_to=offer_in.amount, # Simplified: gross=net for history
            amount=offer_in.amount,
            market_rate=1.0, # Mock rate
            status='pending',
            status='pending',
            timestamp=datetime.now(timezone.utc),
            remittance_purpose=offer_in.remittance_purpose,
            sender_ip=offer_in.sender_ip,
            device_fingerprint=offer_in.device_fingerprint
        )
        
        db.add(new_offer)
        db.commit()
        db.refresh(new_offer)
        
        response = {
            "success": True, 
            "id": tx_uuid,
            "message": "Offer created and persisted"
        }
        
        # 2. Store Result if Key present using Double-Click Protection
        if idempotency_key:
            IDEMPOTENCY_CACHE[idempotency_key] = {
                'response': response,
                'expiry': datetime.now(timezone.utc) + timedelta(hours=24)
            }
        
        return response

    except Exception as e:
        db.rollback()
        print(f"Error creating offer: {e}")
        raise HTTPException(status_code=500, detail=str(e))