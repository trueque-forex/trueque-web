from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
import uuid
from backend.database import get_db
from backend.models.transaction import Transaction
from backend.models.offer_model import Offer
from backend.models.gateway import InstitutionalGateway

router = APIRouter(prefix="/api/trades", tags=["Trades"])

def hydrate_instructions(template: str, details: dict, reference: str):
    """
    Hydrates the instruction template with payment details and the short reference.
    """
    short_ref = reference[:8].upper()
    text = template.replace("{{reference}}", short_ref)
    for key, value in details.items():
        text = text.replace(f"{{{{{key}}}}}", str(value))
    return text

@router.get("/details")
def get_trade_details(id: str = Query(...), db: Session = Depends(get_db)):
    # 1. Fetch the Trade (Corrected for REAL schema)
    trade = db.query(Transaction).filter(Transaction.id == id).first()
    
    is_offer = False
    if not trade:
        # In the real DB, 'id' in 'offers' might be the UUID string
        trade = db.query(Offer).filter(Offer.id == id).first()
        is_offer = True
        if not trade:
            raise HTTPException(status_code=404, detail="Trade or Offer not found")

    # 2. Find the Active Gateway
    source_currency = trade.source_currency
    target_currency = trade.target_currency
    
    # Infer corridor code for lookup
    corridor_map = {
        ("USD", "MXN"): "US-MX",
        ("MXN", "GTQ"): "MX-GT",
        ("USD", "GTQ"): "US-GT",
        ("USD", "DOP"): "US-DR"
    }
    corridor_code = corridor_map.get((source_currency, target_currency))

    query = db.query(InstitutionalGateway).filter(InstitutionalGateway.is_active == True)
    if corridor_code:
        gateway = query.filter(InstitutionalGateway.corridor_code == corridor_code).first()
    else:
        gateway = query.filter(InstitutionalGateway.currency == source_currency).first()

    if not gateway:
        return {"status": trade.status, "error": f"No active gateway found for corridor {corridor_code or source_currency}"}

    details = gateway.payment_details.copy()

    # 4. Hydrate Instructions
    instructions = hydrate_instructions(gateway.instruction_template, details, id)
    reference_code = id[:8].upper()

    # 5. Return the Real Data
    response = {
        "id": id,
        "type": "SYNTHETIC" if is_offer else "DIRECT",
        "status": trade.status,
        "amount": str(trade.amount),
        "source_currency": source_currency,
        "payment_instructions": {
            "rail": gateway.rail_type,
            "bank_name": details.get("bank", details.get("retailer", "Symmetri Gateway")),
            "account_identifier": details.get("clabe") or details.get("phone") or details.get("iban"),
            "beneficiary": details.get("beneficiary") or details.get("retailer") or "Symmetri",
            "concept_code": reference_code,
            "step_by_step": instructions
        },
        "inbound_confirmed": getattr(trade, 'inbound_verified', False)
    }

    response["amount_received"] = str(trade.amount_received)
    response["target_currency"] = trade.target_currency
    
    if not is_offer:
        response["total_fees"] = str(trade.fee)
    else:
        response["total_fees"] = str(trade.fee_total or "0.00")

    return response

@router.post("/signal-funding")
def signal_funding(
    trade_id: str = Body(..., embed=True), 
    db: Session = Depends(get_db)
):
    tx = db.query(Transaction).filter(Transaction.id == trade_id).first()
    if tx:
        tx.status = 'FUNDING_SIGNALED'
        db.commit()
        return {"success": True, "status": tx.status}
    
    offer = db.query(Offer).filter(Offer.id == trade_id).first()
    if offer:
        offer.status = 'FUNDING_SIGNALED'
        db.commit()
        return {"success": True, "status": offer.status}
    
    raise HTTPException(status_code=404, detail="Trade record not found")
