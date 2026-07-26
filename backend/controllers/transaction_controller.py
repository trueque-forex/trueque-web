from decimal import Decimal
from typing import Dict, Any
from datetime import datetime, timezone
import logging
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks

from ..database import SessionLocal
from ..models.transaction import Transaction
from ..models.inventory_model import InventoryVoucher
from ..common.errors import TruequeError, ErrorCode

logger = logging.getLogger(__name__)

def check_low_inventory(retailer_id: str):
    db: Session = SessionLocal()
    try:
        available_count = db.query(InventoryVoucher).filter(
            InventoryVoucher.retailer_id == retailer_id,
            InventoryVoucher.is_allocated == False
        ).count()
        if available_count < 10:
            logger.warning(f"URGENT: {retailer_id} inventory is low. Only {available_count} vouchers remaining.")
    except Exception as e:
        logger.error(f"Failed to check inventory for {retailer_id}: {str(e)}")
    finally:
        db.close()

def allocate_voucher_to_user(
    db: Session, 
    retailer_id: str, 
    value_amount: float, 
    owner_id: str, 
    transaction_id: str
) -> Dict[str, Any]:
    # 1. Query for an available voucher AND lock the row using with_for_update
    # skip_locked=True ensures concurrent requests grab different rows instantly
    available_voucher = db.query(InventoryVoucher).filter(
        InventoryVoucher.retailer_id == retailer_id,
        InventoryVoucher.value_amount == value_amount,
        InventoryVoucher.is_allocated == False
    ).with_for_update(skip_locked=True).first()

    # 2. Handle Empty Vault
    if not available_voucher:
        # In production, this should trigger an urgent internal alert
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Insufficient inventory for this retailer and amount."
        )

    # 3. Stamp the allocation
    available_voucher.is_allocated = True
    import uuid
    available_voucher.allocated_to_owner_id = uuid.UUID(owner_id) if owner_id else None
    available_voucher.transaction_id = uuid.UUID(transaction_id) if transaction_id else None
    available_voucher.allocated_at = datetime.now(timezone.utc)

    # 4. Commit the transaction to save the lock permanently
    db.commit()

    # 5. Return the secure payload so it can be sent to WhatsApp/Next.js
    return {
        "barcode_data": available_voucher.barcode_data,
        "value_amount": float(available_voucher.value_amount),
        "currency": available_voucher.currency
    }

class TransactionController:
    """
    Controller for Symmetri Transactions.
    Enforces Phase 1 Financial and Operational Locks.
    """

    def create_retail_voucher(
        self, 
        db: Session,
        sender_id: str,
        origin_market: str,
        origin_currency: str,
        destination_market: str,
        destination_currency: str,
        amount_origin: Decimal,
        retailer_id: str,
        payment_success_token: str = None,
        background_tasks: BackgroundTasks = None,
        beneficiary_id: str = None
    ) -> Dict[str, Any]:
        """
        Main entry point for generating retail vouchers.
        Enforces $20 MOV Floor and Synchronous Lock.
        """
        
        # 1. THE $20 FLOOR (Hard Constraint)
        if amount_origin < Decimal('20.00'):
            raise TruequeError(
                ErrorCode.VALIDATION_ERROR, 
                "Minimum Order Value (MOV) is $20.00. Payload rejected.",
                400
            )

        # 2. THE SYNCHRONOUS LOCK
        # Symmetri does not finance users. Funds MUST be secured first.
        if not payment_success_token:
            raise TruequeError(
                ErrorCode.PAYMENT_REQUIRED,
                "Synchronous Lock active: valid payment_success_token required before fulfillment.",
                402
            )

        # 3. MARGIN LOGIC (Hidden 15% B2B Wholesale Discount)
        # Store as absolute Decimal value
        wholesale_margin = (amount_origin * Decimal('0.15')).quantize(Decimal('0.0001'))

        # 4. Create Transaction Record
        new_tx = Transaction(
            owner_id=uuid.UUID(sender_id) if sender_id else None,
            amount=amount_origin,
            source_currency=origin_currency,
            destination_country_code=destination_market,
            target_currency=destination_currency,
            retailer_wholesale_margin=wholesale_margin,
            beneficiary_id=uuid.UUID(beneficiary_id) if beneficiary_id else None,
            vendor_id=retailer_id,
            status="pending_fulfillment",
            type="VOUCHER_CREATION",
            description=f"Retail Voucher for {retailer_id} in {destination_market} from {origin_market}"
        )

        try:
            db.add(new_tx)
            db.commit()
            db.refresh(new_tx)

            # --- Allocate Secure Barcode from Vault ---
            voucher_data = allocate_voucher_to_user(
                db=db,
                retailer_id=retailer_id,
                value_amount=float(amount_origin),
                owner_id=sender_id,
                transaction_id=str(new_tx.id)
            )

            # Update the transaction status to fulfilled since we have the barcode
            new_tx.status = "fulfilled"
            db.commit()

            if background_tasks:
                background_tasks.add_task(check_low_inventory, retailer_id)

            return {
                "success": True,
                "transaction_id": str(new_tx.id),
                "principal": float(amount_origin),
                "margin_captured": float(wholesale_margin),
                "status": "fulfilled",
                "barcode_data": voucher_data["barcode_data"],
                "value_amount": voucher_data["value_amount"],
                "currency": voucher_data["currency"]
            }
        except Exception as e:
            db.rollback()
            raise TruequeError(ErrorCode.INTERNAL_ERROR, f"Transaction failed: {str(e)}", 500)
