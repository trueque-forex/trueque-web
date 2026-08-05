
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db

router = APIRouter(prefix="/api/merchants", tags=["Merchants"])

class RedeemRequest(BaseModel):
    voucher_code: str
    store_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    merchant_id: str

@router.post("/redeem")
def redeem_voucher(req: RedeemRequest, db: Session = Depends(get_db)):
    try:
        # Check merchant role (in real app, use auth middleware, for now we trust Next.js proxy)
        # Note: the Next.js proxy will authenticate and check user_type = 'MERCHANT'
        
        voucher_res = db.execute(
            text("""
                SELECT v.id as vid, v.is_allocated, v.is_voided, v.retailer_id, v.value_amount, t.status, t.id as tid
                FROM inventory_vouchers v
                JOIN transactions t ON v.transaction_id = t.id
                WHERE v.barcode_data = :v
                FOR UPDATE
            """),
            {"v": req.voucher_code}
        ).fetchone()

        if not voucher_res:
            raise HTTPException(status_code=404, detail="Voucher not found")
            
        vid, is_allocated, is_voided, retailer_id, amount_local, status, tid = voucher_res
        
        if not is_allocated or is_voided or status != 'fulfilled':
            raise HTTPException(status_code=400, detail=f"Voucher cannot be redeemed. Status: {status}, Voided: {is_voided}")

        # Mark redeemed on transaction
        loc_str = None
        if req.lat and req.lng:
            loc_str = f'{{"lat": {req.lat}, "lng": {req.lng}}}'
            
        db.execute(
            text("UPDATE transactions SET status = 'REDEEMED' WHERE id = :tid"),
            {"tid": tid}
        )
        
        db.commit()
        
        return {"success": True, "message": "Voucher redeemed successfully", "voucher": {"status": "REDEEMED", "id": str(vid)}}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

