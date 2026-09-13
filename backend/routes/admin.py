
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend.database import get_db
from ..services.fx_consensus import FXConsensusService
from backend.audit_db import AuditDB
from ..logic.investor_report import InvestorReportGenerator
import sqlite3
import os
import json
from datetime import datetime

async def verify_internal_key(x_symmetri_internal_key: str = Header(None)):
    if x_symmetri_internal_key != "SECRET_ADMIN_KEY":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")

router = APIRouter(prefix="/api/admin", tags=["Admin"], dependencies=[Depends(verify_internal_key)])

@router.get("/fx-live")
async def get_fx_live(base: str = "EUR", target: str = "USD"):
    """
    Returns live "Truth Rate" breakdown for the dashboard.
    """
    try:
        data = FXConsensusService.get_live_breakdown(base, target)
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/audit-feed")
async def get_audit_feed(limit: int = 10):
    """
    Stream of investigative narratives.
    """
    try:
        conn = AuditDB.get_connection()
        c = conn.cursor()
        # Ensure we get col names
        c.execute(f"SELECT * FROM audit_alerts ORDER BY id DESC LIMIT {limit}")
        cols = [description[0] for description in c.description]
        rows = c.fetchall()
        conn.close()
        
        feed = [dict(zip(cols, row)) for row in rows]
        return {"success": True, "feed": feed}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/security-status")
async def get_security_status():
    """
    Vitals check for Encryption and Blind Indexing.
    """
    try:
        # Check Main DB
        db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'trueque.db')
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("PRAGMA table_info(users)")
        cols = [col[1] for col in c.fetchall()]
        conn.close()
        
        # Check Audit DB
        audit_path = os.path.join(os.path.dirname(__file__), '..', '..', 'audit_trail.db')
        audit_exists = os.path.exists(audit_path)
        if not audit_exists:
             # Fallback check relative to backend
             audit_path = os.path.join(os.path.dirname(__file__), '..', 'audit_trail.db')
             audit_exists = os.path.exists(audit_path)

        return {
            "success": True,
            "vitals": {
                "field_encryption": "dob_enc" in cols,
                "blind_indexing": "dob_bidx" in cols,
                "audit_vault_connected": audit_exists,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/social-subsidy")
async def get_social_subsidy(db: Session = Depends(get_db)):
    """
    Aggregates the Social Subsidy Fund (0.2% premium on >$500 volume).
    MOCKED for demo as complex aggregation requires full transaction history logic.
    """
    # Logic: Sum trueque_fee for transactions where rate was 1.2% (vs 0.5% base).
    # Approx: $1250 total collected.
    return {
        "success": True,
        "fund_total": 1250.50,
        "currency": "USD",
        "contributors_count": 42
    }

@router.get("/investor-report")
async def get_investor_report():
    """
    Downloadable JSON/HTML Report.
    """
    try:
        report = InvestorReportGenerator.generate_full_report()
        return {
            "success": True,
            "report": report
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

from pydantic import BaseModel
from sqlalchemy import text

class LiquidityFundRequest(BaseModel):
    retailer_id: str
    amount: float
    currency: str

@router.post('/liquidity/fund')
async def fund_liquidity(req: LiquidityFundRequest, db: Session = Depends(get_db)):
    try:
        # Check if row exists
        existing = db.execute(text('SELECT id FROM synthetic_liquidity WHERE retailer_id = :r'), {'r': req.retailer_id}).fetchone()
        if existing:
            db.execute(
                text('UPDATE synthetic_liquidity SET available_balance = available_balance + :amt, currency = :cur, updated_at = NOW() WHERE retailer_id = :r'),
                {'amt': req.amount, 'cur': req.currency, 'r': req.retailer_id}
            )
        else:
            db.execute(
                text('INSERT INTO synthetic_liquidity (retailer_id, available_balance, currency) VALUES (:r, :amt, :cur)'),
                {'amt': req.amount, 'cur': req.currency, 'r': req.retailer_id}
            )
        db.commit()
        return {'success': True, 'message': 'Liquidity funded successfully'}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

from ..models.transaction import Transaction
from ..models.inventory_model import InventoryVoucher

@router.post('/transactions/cancel-pending')
async def cancel_pending_voucher_transactions(db: Session = Depends(get_db)):
    """
    Cancels all PENDING transactions strictly limited to VOUCHER_CREATION.
    Refunds synthetic liquidity and unallocates vouchers.
    """
    try:
        pending_txs = db.query(Transaction).filter(
            Transaction.status.in_(['PENDING', 'PENDING_FULFILLMENT']),
            Transaction.type == 'VOUCHER_CREATION'
        ).all()
        
        count = 0
        for tx in pending_txs:
            # 1. Refund Synthetic Liquidity
            if tx.vendor_id:
                db.execute(
                    text('UPDATE synthetic_liquidity SET available_balance = available_balance + :amt WHERE retailer_id = :r'),
                    {'amt': float(tx.amount), 'r': tx.vendor_id}
                )
            
            # 2. Unallocate Voucher
            voucher = db.query(InventoryVoucher).filter(InventoryVoucher.transaction_id == tx.id).first()
            if voucher:
                voucher.is_allocated = False
                voucher.allocated_to_owner_id = None
                voucher.transaction_id = None
                voucher.allocated_at = None
            
            # 3. Cancel Transaction
            tx.status = 'CANCELLED'
            count += 1
            
        db.commit()
        return {'success': True, 'cancelled_count': count}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

