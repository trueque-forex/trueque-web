# backend/routes/beneficiaries.py
#
# FastAPI data-orchestration layer for beneficiaries.
# Next.js /api/beneficiaries.ts MUST proxy here — it is forbidden from
# querying the database directly (GEMINI.md §5, "Neutral Orchestrator" Mandate).
#
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime, timezone
import uuid, json

from backend.database import get_db

router = APIRouter(prefix="/api/beneficiaries", tags=["Beneficiaries"])


# ── Pydantic Schemas ─────────────────────────────────────────────────────────

class BeneficiaryCreate(BaseModel):
    owner_id: str                      # UUID — injected by Next.js from session; never trusted from UI
    name: str
    method: str                        # e.g. "bank_rtp", "rtp_spei"
    identifiers: Dict[str, Any]        # {bank_name, account_number, phone, email, …}
    country: Optional[str] = "US"

    class Config:
        extra = "forbid"


class BeneficiaryUpdate(BaseModel):
    id: str                            # Beneficiary UUID
    owner_id: str                      # Injected from session by Next.js proxy
    name: Optional[str] = None
    method: str
    identifiers: Dict[str, Any]

    class Config:
        extra = "forbid"


# ── Helpers ──────────────────────────────────────────────────────────────────

def _serialize_row(row: Any) -> dict:
    """
    Normalises a beneficiaries table row into a stable API shape.
    Handles both native-JSON and double-encoded string metadata.
    """
    md = row.metadata_ if hasattr(row, "metadata_") else (row["metadata"] if "metadata" in row.keys() else {})
    if isinstance(md, str):
        try:
            md = json.loads(md)
        except Exception:
            md = {}

    return {
        "id": str(row["id"]),
        "owner_id": str(row["owner_id"]),     # Canonical name — never aliased
        "name": md.get("name") or "Unknown",
        "country": md.get("country") or "US",
        "method": md.get("method") or "unknown",
        "identifiers": md.get("identifiers") or {},
        "saved_methods": md.get("saved_methods"),
        "status": "approved",
        "created_at": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
    }


# ── GET /api/beneficiaries?owner_id=<uuid> ───────────────────────────────────

@router.get("")
def list_beneficiaries(
    owner_id: str = Query(..., description="UUID from authenticated session — injected by Next.js proxy"),
    db: Session = Depends(get_db),
):
    """
    Returns all beneficiaries belonging to the authenticated user.
    owner_id is ALWAYS injected by the Next.js proxy from the verified JWT session.
    It is NEVER read from a query param supplied by the browser.
    """
    rows = db.execute(
        text("SELECT * FROM beneficiaries WHERE owner_id = :uid ORDER BY created_at DESC"),
        {"uid": owner_id},
    ).fetchall()

    return [_serialize_row(r) for r in rows]


# ── POST /api/beneficiaries ───────────────────────────────────────────────────

@router.post("", status_code=201)
def create_beneficiary(payload: BeneficiaryCreate, db: Session = Depends(get_db)):
    """
    Creates a new beneficiary record owned by the authenticated user.
    All metadata is stored as a JSON blob — no PII in flat columns.
    """
    metadata = {
        "name": payload.name,
        "method": payload.method,
        "identifiers": payload.identifiers,
        "country": payload.country,
    }

    new_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    db.execute(
        text("""
            INSERT INTO beneficiaries (id, owner_id, metadata, created_at)
            VALUES (:id, :owner_id, :metadata, :created_at)
        """),
        {
            "id": str(new_id),
            "owner_id": payload.owner_id,
            "metadata": json.dumps(metadata),
            "created_at": now,
        },
    )
    db.commit()

    row = db.execute(
        text("SELECT * FROM beneficiaries WHERE id = :id"),
        {"id": str(new_id)},
    ).fetchone()

    return _serialize_row(row)


# ── PUT /api/beneficiaries ────────────────────────────────────────────────────

@router.put("")
def update_beneficiary(payload: BeneficiaryUpdate, db: Session = Depends(get_db)):
    """
    Updates or merges a payment method into an existing beneficiary's metadata.
    Enforces owner_id guard — users can only mutate their own records.
    """
    row = db.execute(
        text("SELECT * FROM beneficiaries WHERE id = :id AND owner_id = :owner_id"),
        {"id": payload.id, "owner_id": payload.owner_id},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Beneficiary not found or access denied")

    # Parse existing metadata
    existing_md = row["metadata"] if "metadata" in row.keys() else {}
    if isinstance(existing_md, str):
        try:
            existing_md = json.loads(existing_md)
        except Exception:
            existing_md = {}

    # Ensure saved_methods structure exists (migrate legacy flat rows if needed)
    if "saved_methods" not in existing_md:
        existing_md["saved_methods"] = {}
        if existing_md.get("method") and existing_md.get("identifiers"):
            existing_md["saved_methods"][existing_md["method"]] = existing_md["identifiers"]

    # Merge the new method
    existing_md["saved_methods"][payload.method] = payload.identifiers

    # Update top-level fields (last-used method)
    existing_md["method"] = payload.method
    existing_md["identifiers"] = payload.identifiers
    if payload.name:
        existing_md["name"] = payload.name

    db.execute(
        text("UPDATE beneficiaries SET metadata = :metadata WHERE id = :id AND owner_id = :owner_id"),
        {
            "metadata": json.dumps(existing_md),
            "id": payload.id,
            "owner_id": payload.owner_id,
        },
    )
    db.commit()

    updated_row = db.execute(
        text("SELECT * FROM beneficiaries WHERE id = :id"),
        {"id": payload.id},
    ).fetchone()

    return _serialize_row(updated_row)
