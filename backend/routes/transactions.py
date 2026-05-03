from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional

from backend.database import get_db
from ..controllers.transaction_controller import TransactionController

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

class VoucherRequest(BaseModel):
    owner_id: str = Field(..., description="The @Handle or UUID of the owner")
    principal: Decimal = Field(..., description="The amount to transition, minimum $20.00", ge=20)
    currency: str = Field(..., description="Source currency code (e.g., USD)")
    destination_country: str = Field(..., description="Destination country code (e.g., MX)")
    target_currency: str = Field(..., description="Target currency code (e.g., MXN)")
    payment_success_token: str = Field(..., description="Required token for Synchronous Lock")
    beneficiary_id: Optional[str] = Field(None, description="Optional @Handle or UUID of beneficiary")

    class Config:
        extra = "forbid"

transaction_controller = TransactionController()

@router.post("/voucher")
async def create_voucher(request: VoucherRequest, db: Session = Depends(get_db)):
    """
    Exposes Symmetri Flow A: Retail Voucher Creation.
    Enforces Zero-Custody and $20 Floor.
    """
    try:
        return transaction_controller.create_retail_voucher(
            db=db,
            owner_id=request.owner_id,
            principal=request.principal,
            currency=request.currency,
            destination_country=request.destination_country,
            target_currency=request.target_currency,
            payment_success_token=request.payment_success_token,
            beneficiary_id=request.beneficiary_id
        )
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise HTTPException(status_code=e.status_code, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))