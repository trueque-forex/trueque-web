from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timedelta
from backend.database import get_db
from backend.models.inventory_model import InventoryVoucher
from backend.models.transaction import Transaction

router = APIRouter(prefix="/api/vouchers", tags=["Vouchers"])

RETAILER_NAMES = {
    "farmacias_guadalajara": "Farmacias Guadalajara",
    "latorre": "La Torre",
    "super_selectos": "Super Selectos",
    "bravo": "Bravo",
    "soriana": "Soriana",
    "chedraui": "Chedraui",
    "walmart": "Walmart",
    "bodega_aurrera": "Bodega Aurrera",
    "oxxo": "OXXO"
}

@router.get("/{code}")
def get_voucher_details(code: str, db: Session = Depends(get_db)):
    voucher = db.query(InventoryVoucher).filter(InventoryVoucher.barcode_data == code).first()
    
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
        
    merchant_name = RETAILER_NAMES.get(voucher.retailer_id, voucher.retailer_id.replace("_", " ").title())
    
    transaction = None
    if voucher.transaction_id:
        transaction = db.query(Transaction).filter(Transaction.id == voucher.transaction_id).first()
        
    status = "Ready to Use"
    if voucher.is_voided:
        status = "Voided"
    elif transaction and transaction.status == "PENDING":
        status = "Pending Settlement"
    elif transaction and transaction.status == "REDEEMED":
        status = "Redeemed"
    elif not voucher.is_allocated:
        status = "Ready to Use" # Even if not allocated, for a synthetic one it might just exist
        
    # By default, Symmetri vouchers expire 30 days after creation
    expires_at = voucher.created_at + timedelta(days=30)
    if voucher.allocated_at:
        expires_at = voucher.allocated_at + timedelta(days=30)
        
    return {
        "code": voucher.barcode_data,
        "merchant_name": merchant_name,
        "amount": float(voucher.value_amount),
        "currency": voucher.currency,
        "status": status,
        "created_at": voucher.created_at,
        "expires_at": expires_at
    }
