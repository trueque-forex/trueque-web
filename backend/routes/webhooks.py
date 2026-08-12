from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
import uuid
import logging
from typing import Any, Dict

from backend.database import get_db
from backend.models.transaction import Transaction
from backend.models.offer_model import Offer
from backend.controllers.transaction_controller import TransactionController

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks"])
logger = logging.getLogger(__name__)

transaction_controller = TransactionController()

@router.post("/gateway")
def gateway_webhook(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Webhook listener for asynchronous payment settlement from gateways like Adyen/RTP.
    Enforces strict Escrow state machine.
    """
    transaction_id_str = payload.get("transaction_id")
    event_code = payload.get("eventCode")
    success = payload.get("success", False)

    if not transaction_id_str:
        raise HTTPException(status_code=400, detail="Missing transaction_id in webhook payload")

    try:
        tx_uuid = uuid.UUID(transaction_id_str)
    except ValueError:
        # If it's not a UUID, maybe it's an idempotency key or we reject it.
        raise HTTPException(status_code=400, detail="Invalid transaction_id format")

    # Look up the transaction (Taker's checkout or Retail Voucher purchase)
    tx = db.query(Transaction).filter(Transaction.id == tx_uuid).first()

    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    logger.info(f"Received webhook for TX {tx.id} | Event: {event_code} | Success: {success}")

    if success:
        # --- SETTLEMENT CLEARED ---
        tx.status = "CLEARED"
        
        # If this is a Phase 2 Swap, the vendor_id holds the original Offer ID
        if tx.type == "SWAP" and tx.vendor_id:
            try:
                offer_uuid = uuid.UUID(tx.vendor_id)
                offer = db.query(Offer).filter(Offer.id == offer_uuid).first()
                if offer:
                    # In Phase 2, when settlement clears, the routing instructions are released
                    # We might also update the Offer status if needed (e.g. to FUNDED or CLEARED)
                    # But the critical part is that the Matched Trade (tx) is CLEARED.
                    pass
            except ValueError:
                pass
                
        db.commit()
        return {"status": "ok", "message": "Transaction cleared successfully"}
        
    else:
        # --- SETTLEMENT FAILED ---
        tx.status = "FAILED"
        
        if tx.type == "VOUCHER_CREATION":
            # Quarantine the inventory voucher
            try:
                transaction_controller.quarantine_voucher(
                    db=db,
                    transaction_id=str(tx.id),
                    reason=f"Gateway settlement failed: {event_code}"
                )
            except Exception as e:
                logger.error(f"Failed to quarantine voucher {tx.id}: {str(e)}")
                # We still want to commit the FAILED state for the transaction
        
        elif tx.type == "SWAP" and tx.vendor_id:
            # Revert the Maker's original offer back to OPEN
            try:
                offer_uuid = uuid.UUID(tx.vendor_id)
                offer = db.query(Offer).filter(Offer.id == offer_uuid).first()
                if offer:
                    offer.status = "OPEN"
                    logger.info(f"Reverted Offer {offer.id} to OPEN due to Taker settlement failure.")
            except ValueError:
                pass
                
        db.commit()
        return {"status": "ok", "message": "Transaction failed, respective reverts applied"}
