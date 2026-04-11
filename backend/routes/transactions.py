# backend/routes/transactions.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..models.transaction import Transaction
from ..models.user_kyc import UserKYC
from ..database import get_db
from ..lib.trueque_id import generate_trueque_id

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.post("/create")
async def create_transaction(
    offer_id: str,
    counterparty_user_id: int,
    amount_send: float,
    amount_receive: float,
    currency_from: str,
    currency_to: str,
    user_id: int,  # From authenticated session
    db: Session = Depends(get_db)
):
    """
    Create a new transaction
    Checks KYC requirements before proceeding
    """
    try:
        # Convert to USD for KYC check (simplified - use real exchange rates in production)
        amount_usd = amount_send if currency_from == 'USD' else amount_receive
        
        # Check KYC requirement
        kyc_record = db.query(UserKYC).filter(UserKYC.user_id == user_id).first()
        
        requires_kyc = False
        kyc_reason = None
        
        if not kyc_record:
            kyc_record = UserKYC(
                user_id=user_id,
                trueque_id=get_user_trueque_id(user_id, db),
                transaction_count=0,
                total_transaction_value_usd=0
            )
            db.add(kyc_record)
            db.commit()
        
        # Check KYC triggers
        if kyc_record.kyc_status != 'approved':
            if amount_usd >= 150:
                requires_kyc = True
                kyc_reason = "Transaction amount >= $150 USD"
            elif kyc_record.transaction_count >= 3:
                requires_kyc = True
                kyc_reason = "Completed 3+ transactions"
        
        if requires_kyc:
            # Update KYC status
            kyc_record.kyc_status = 'required'
            db.commit()
            
            raise HTTPException(
                status_code=403, 
                detail={
                    "error": "KYC_REQUIRED",
                    "message": "Please complete KYC verification to proceed",
                    "reason": kyc_reason,
                    "redirect_to": "/kyc"
                }
            )
        
        # Generate transaction ID
        transaction_id = generate_trueque_id(
            datetime.now(timezone.utc),
            currency_from[:2],
            kyc_record.transaction_count + 1
        )
        
        # Create transaction
        transaction = Transaction(
            transaction_id=transaction_id,
            user_a_id=user_id,
            user_b_id=counterparty_user_id,
            user_a_sends_amount=amount_send,
            user_a_sends_currency=currency_from,
            user_b_sends_amount=amount_receive,
            user_b_sends_currency=currency_to,
            status='pending',
            kyc_checked=True,
            kyc_required=False
        )
        
        db.add(transaction)
        db.commit()
        
        return {
            "success": True,
            "transaction_id": transaction_id,
            "status": "pending",
            "message": "Transaction created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating transaction: {str(e)}")