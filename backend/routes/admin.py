
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.fx_consensus import FXConsensusService
from ..audit_db import AuditDB
from ..logic.investor_report import InvestorReportGenerator
import sqlite3
import os
import json
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin"])

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
