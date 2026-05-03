from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import uuid

from ..models.offer_model import Offer
from backend.database import get_db
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
        # 1.5 KYC Limit Check
        from ..logic.limit_enforcer import LimitEnforcer
        # MAPPING: Payload 'user_id' -> Domain 'owner_id'
        owner_id = offer_in.user_id 
        LimitEnforcer.check_limit(owner_id, float(offer_in.amount), db)

        # 1.6 Behavioral Risk Engine
        from ..logic.risk_engine import RiskEngine
        from ..audit_db import AuditDB
        from ..services.audit_assistant import AuditAssistant

        # Initialize Audit DB safely (idempotent)
        AuditDB.init_db()

        # A. Velocity (24h) -> Checks for 2nd Tx
        risk_decision_24h = RiskEngine.check_velocity(owner_id, float(offer_in.amount), db)
        
        # B. Weekly Shield (7d)
        risk_decision_7d = RiskEngine.check_weekly_shield(owner_id, float(offer_in.amount), db)
        
        # C. IP Check
        risk_decision_ip = RiskEngine.check_ip_risk(offer_in.country, offer_in.sender_ip)
        
        final_status = 'pending'
        
        # Consolidated Decision
        if risk_decision_24h.action == 'review':
             print(f"Risk Flag (24h): {risk_decision_24h.reason}")
             if risk_decision_24h.status:
                 final_status = risk_decision_24h.status # STATUS_AUDIT_PENDING
             else:
                 final_status = 'pending_manual_review'
                 
             # TRIGGER AUDIT LOG & ASSISTANT
             summary = AuditAssistant.generate_good_faith_summary(owner_id, db)
             AuditDB.log_alert(owner_id, "VELOCITY_TRIGGER", f"{risk_decision_24h.reason}. Assistant: {summary}", offer_in.device_fingerprint or "N/A")

        elif risk_decision_7d.action == 'review':
             print(f"Risk Flag (Weekly): {risk_decision_7d.reason}")
             final_status = 'pending_manual_review'
             AuditDB.log_alert(owner_id, "WEEKLY_SHIELD", risk_decision_7d.reason, offer_in.device_fingerprint or "N/A")

        elif risk_decision_ip.action == 'review':
             print(f"Risk Flag (IP): {risk_decision_ip.reason}")
             final_status = 'pending_manual_review'
             AuditDB.log_alert(owner_id, "IP_MISMATCH", risk_decision_ip.reason, offer_in.device_fingerprint or "N/A")

        # Generate a proper UUID for the offer/transaction
        tx_uuid = f"TX-{uuid.uuid4()}"
        
        new_offer = Offer(
            owner_id=owner_id,
            uuid=tx_uuid,
            country=offer_in.country,
            currency_from=offer_in.currency_from,
            currency_to=offer_in.currency_to,
            amount_from=offer_in.amount,
            amount_to=offer_in.amount, # Simplified: gross=net for history
            amount_offered=offer_in.amount,
            market_rate=1.0, # Mock rate
            status=final_status,
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
        
        if final_status == 'STATUS_AUDIT_PENDING':
             response['message'] = "Offer Under Audit"
        
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