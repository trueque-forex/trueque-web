from decimal import Decimal
from typing import Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.transaction import Transaction
from ..common.errors import TruequeError, ErrorCode

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
            user_id=sender_id,
            amount=amount_origin,
            source_currency=origin_currency,
            destination_country_code=destination_market,
            target_currency=destination_currency,
            retailer_wholesale_margin=wholesale_margin,
            beneficiary_id=beneficiary_id,
            vendor_id=retailer_id,
            status="pending_fulfillment",
            type="VOUCHER_CREATION",
            description=f"Retail Voucher for {retailer_id} in {destination_market} from {origin_market}"
        )

        try:
            db.add(new_tx)
            db.commit()
            db.refresh(new_tx)
            
            # TODO: Ping Partner Retailer API here using payment_success_token
            # ...
            
            return {
                "success": True,
                "transaction_id": str(new_tx.id),
                "principal": float(principal),
                "margin_captured": float(wholesale_margin),
                "status": "authorized_for_fulfillment"
            }
        except Exception as e:
            db.rollback()
            raise TruequeError(ErrorCode.INTERNAL_ERROR, f"Transaction failed: {str(e)}", 500)
