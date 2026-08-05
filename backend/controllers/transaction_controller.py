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
        
        # 0. THE IDEMPOTENCY CHECK (Double-Tap Protection)
        if payment_success_token:
            existing_tx = db.query(Transaction).filter(
                Transaction.idempotency_key == payment_success_token
            ).first()
            if existing_tx:
                logger.info(f"Idempotency hit for token {payment_success_token}. Returning existing voucher.")
                existing_voucher = db.query(InventoryVoucher).filter(
                    InventoryVoucher.transaction_id == existing_tx.id
                ).first()
                if not existing_voucher:
                    raise TruequeError(
                        ErrorCode.VALIDATION_ERROR,
                        "Idempotent transaction found but no voucher was allocated.",
                        500
                    )
                return {
                    "barcode_data": existing_voucher.barcode_data,
                    "value_amount": float(existing_voucher.value_amount),
                    "currency": existing_voucher.currency
                }

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

        # 2.5 SYNTHETIC LIQUIDITY CHECK
        from sqlalchemy import text
        liq_row = db.execute(
            text("SELECT available_balance, currency FROM synthetic_liquidity WHERE retailer_id = :r FOR UPDATE"),
            {"r": retailer_id}
        ).fetchone()

        if not liq_row or liq_row[0] < float(amount_origin):
            raise TruequeError(
                ErrorCode.VALIDATION_ERROR,
                f"Insufficient synthetic liquidity for retailer {retailer_id}.",
                400
            )

        # Deduct liquidity
        db.execute(
            text("UPDATE synthetic_liquidity SET available_balance = available_balance - :amt WHERE retailer_id = :r"),
            {"amt": float(amount_origin), "r": retailer_id}
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
            description=f"Retail Voucher for {retailer_id} in {destination_market} from {origin_market}",
            idempotency_key=payment_success_token
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

            return voucher_data

        except TruequeError:
            db.rollback()
            raise
        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Voucher creation failed: {str(e)}", exc_info=True)
            raise TruequeError(
                ErrorCode.INTERNAL_ERROR,
                "Failed to fulfill voucher. Please contact support.",
                500
            )

    def quarantine_voucher(
        self,
        db: Session,
        transaction_id: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        The Quarantine Protocol.
        Voids the voucher if the underlying fiat transaction is reversed (e.g. chargeback).
        """
        # 1. Find the transaction
        tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")

        # 2. Find the associated voucher
        voucher = db.query(InventoryVoucher).filter(InventoryVoucher.transaction_id == tx.id).first()
        if not voucher:
            raise HTTPException(status_code=404, detail="No voucher associated with this transaction")

        if voucher.is_voided:
            return {"status": "success", "message": "Voucher is already quarantined."}

        # 3. Apply the quarantine locks
        try:
            voucher.is_voided = True
            voucher.voided_reason = reason
            tx.status = "VOIDED"
            
            db.commit()
            
            logger.warning(f"QUARANTINE TRIGGERED: Voucher {voucher.id} voided due to {reason}.")
            return {"status": "success", "message": f"Voucher successfully quarantined for reason: {reason}"}
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to quarantine voucher: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to apply quarantine lock")

