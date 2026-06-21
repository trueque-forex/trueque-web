from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional

from backend.database import get_db
from ..controllers.transaction_controller import TransactionController

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

class VoucherRequest(BaseModel):
    sender_id: str = Field(..., description="The UUID of the sender")
    origin_market: str = Field(..., description="Origin market code (e.g., US, ES)")
    origin_currency: str = Field(..., description="Source currency code (e.g., USD, EUR)")
    destination_market: str = Field(..., description="Destination market code (e.g., GT, DO)")
    destination_currency: str = Field(..., description="Target currency code (e.g., GTQ, DOP)")
    amount_origin: Decimal = Field(..., description="The amount to transition, minimum $20.00", ge=20)
    retailer_id: str = Field(..., description="Retailer ID (e.g., latorre)")
    payment_success_token: str = Field(..., description="Required token for Synchronous Lock")
    beneficiary_id: Optional[str] = Field(None, description="Optional UUID of beneficiary")

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
            sender_id=request.sender_id,
            origin_market=request.origin_market,
            origin_currency=request.origin_currency,
            destination_market=request.destination_market,
            destination_currency=request.destination_currency,
            amount_origin=request.amount_origin,
            retailer_id=request.retailer_id,
            payment_success_token=request.payment_success_token,
            beneficiary_id=request.beneficiary_id
        )
    except Exception as e:
        if hasattr(e, 'status_code'):
            raise HTTPException(status_code=e.status_code, detail=str(e))
        raise HTTPException(status_code=500, detail=str(e))