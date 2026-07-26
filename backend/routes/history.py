# backend/routes/history.py
#
# FastAPI data-orchestration layer for user transaction history.
# Next.js /api/history.ts MUST proxy to /api/history/me — it is forbidden
# from querying the database directly (GEMINI.md §5 mandate).
#
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..models.offer_model import Offer
from backend.database import SessionLocal, get_db

router = APIRouter(tags=["History"])


def get_db_local():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── NEW: Authenticated user history (proxied by Next.js /api/history.ts) ─────

@router.get("/api/history/me")
def get_my_history(
    owner_id: str = Query(..., description="UUID from authenticated session — injected by Next.js proxy"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Returns the last `limit` trades where the calling user was maker or taker.
    owner_id is ALWAYS injected by the Next.js proxy from the verified JWT — never from the browser.
    """
    rows = db.execute(
        text("""
            SELECT
                t.id,
                t.amount,
                t.sent_currency,
                t.received_currency,
                t.received_amount,
                t.status,
                t.created_at,
                t.completed_at
            FROM trades t
            WHERE t.maker_id = :uid OR t.taker_id = :uid
            ORDER BY t.created_at DESC
            LIMIT :lim
        """),
        {"uid": owner_id, "lim": limit},
    ).fetchall()

    return [
        {
            "id": str(r["id"]),
            "amount": float(r["amount"] or 0),
            "currencyFrom": r["sent_currency"] or "---",
            "currencyTo": r["received_currency"] or "---",
            "valueDelivered": f"{float(r['received_amount']):.2f}" if r["received_amount"] is not None else "---",
            "status": (r["status"] or "PENDING").upper(),
            "date": r["created_at"].strftime("%Y-%m-%d") if r["created_at"] else "---",
        }
        for r in rows
    ]


# ── Legacy endpoints (kept for backward-compatibility) ────────────────────────

@router.get("/history/{uuid}")
def get_user_history_uuid(uuid: str, db: Session = Depends(get_db_local)):
    # Legacy/By-Transaction endpoint
    offers = db.query(Offer).filter(Offer.uuid == uuid).all()
    return [offer.__dict__ for offer in offers]


@router.get("/history/user/{user_id}")
def get_user_history(user_id: int, db: Session = Depends(get_db_local)):
    offers = db.query(Offer).filter(Offer.user_id == user_id).order_by(Offer.timestamp.desc()).all()
    return [offer for offer in offers]