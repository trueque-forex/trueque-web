# backend/routes/kyc.py
#
# All endpoints read user identity from the JWT session (GEMINI.md §5).
# user_id is NEVER accepted from req.body — owner_id is the canonical FK column.
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Header
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
import json
import uuid

from ..models.user_kyc import UserKYC
from ..models.transaction import Transaction
from ..models.user import User
from backend.database import get_db
from ..services.kyc_service import KYCService
from ..services.file_upload_service import FileUploadService
from ..utils.checksum import iso7064_mod97_10

router = APIRouter(prefix="/api/kyc", tags=["KYC"])


# ---------------------------------------------------------------------------
# Internal helper — resolve owner_id from the Authorization header JWT.
# In production this must decode and verify the JWT. For now it calls a
# shared auth utility that extracts the sub claim.
# ---------------------------------------------------------------------------
def _get_owner_id_from_token(authorization: str) -> uuid.UUID:
    """
    Extract the authenticated user's UUID from the Bearer JWT.
    Raises HTTP 401 if the token is missing or invalid.
    GEMINI.md §5 — session.user.id is the ONLY trusted source of identity.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        from ..middleware.auth import decode_jwt
        payload = decode_jwt(token)
        return uuid.UUID(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# POST /api/kyc/check
# ---------------------------------------------------------------------------
@router.post("/check")
async def check_kyc_requirement(
    transaction_amount_usd: float,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Check if the authenticated user needs to complete KYC before proceeding.

    Rules (GEMINI.md §3 — Good Faith rule):
    - EMPTY: blocked from swap entirely.
    - PENDING: one provisional swap, max $200.
    - APPROVED: full limits.
    """
    owner_id = _get_owner_id_from_token(authorization)

    try:
        kyc_record = db.query(UserKYC).filter(UserKYC.owner_id == owner_id).first()

        if not kyc_record:
            # Fetch the user's symmetri_id for the new KYC record
            user = db.query(User).filter(User.id == owner_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            kyc_record = UserKYC(
                owner_id=owner_id,
                symmetri_id=user.symmetri_id,
                kyc_status="EMPTY",
                transaction_count=0,
                total_transaction_value_usd=0,
            )
            db.add(kyc_record)
            db.commit()

        if kyc_record.kyc_status == "APPROVED":
            return {"kyc_required": False, "kyc_status": "APPROVED", "reason": "KYC already approved"}

        if kyc_record.kyc_status == "EMPTY":
            return {"kyc_required": True, "kyc_status": "EMPTY", "reason": "KYC not started — swap blocked"}

        # PENDING: one provisional swap up to $200
        if kyc_record.kyc_status == "PENDING":
            if transaction_amount_usd > 200:
                return {
                    "kyc_required": True,
                    "kyc_status": "PENDING",
                    "reason": "PENDING users are limited to $200 provisional swap",
                }
            return {
                "kyc_required": False,
                "kyc_status": "PENDING",
                "provisional": True,
                "limit_usd": 200,
            }

        return {
            "kyc_required": False,
            "kyc_status": kyc_record.kyc_status,
            "transaction_count": kyc_record.transaction_count,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking KYC: {str(e)}")


# ---------------------------------------------------------------------------
# POST /api/kyc/submit
# ---------------------------------------------------------------------------
@router.post("/submit")
async def submit_kyc(
    kyc_data: str = Form(...),
    document_front: UploadFile = File(...),
    document_back: Optional[UploadFile] = File(None),
    selfie: UploadFile = File(...),
    proof_of_address: UploadFile = File(...),
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Submit KYC documents for the authenticated user.
    Identity comes exclusively from the JWT — no user_id in the form body.
    On submission, kyc_status moves EMPTY → PENDING and trade_mask_sid is issued.
    """
    owner_id = _get_owner_id_from_token(authorization)

    try:
        data = json.loads(kyc_data)

        user = db.query(User).filter(User.id == owner_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        kyc_record = db.query(UserKYC).filter(UserKYC.owner_id == owner_id).first()
        if not kyc_record:
            kyc_record = UserKYC(owner_id=owner_id, symmetri_id=user.symmetri_id)
            db.add(kyc_record)

        # Upload documents to secure storage
        file_service = FileUploadService()
        document_front_url = await file_service.upload_kyc_document(str(owner_id), "document_front", document_front)
        document_back_url = await file_service.upload_kyc_document(str(owner_id), "document_back", document_back) if document_back else None
        selfie_url = await file_service.upload_kyc_document(str(owner_id), "selfie", selfie)
        proof_of_address_url = await file_service.upload_kyc_document(str(owner_id), "proof_of_address", proof_of_address)

        # Personal info
        kyc_record.full_legal_name = data.get("fullLegalName")
        kyc_record.date_of_birth = data.get("dateOfBirth")
        kyc_record.nationality = data.get("nationality")
        kyc_record.occupation = data.get("occupation")

        # Address
        kyc_record.street = data.get("street")
        kyc_record.city = data.get("city")
        kyc_record.state = data.get("state")
        kyc_record.postal_code = data.get("postalCode")
        kyc_record.country = data.get("country")

        # Document info
        kyc_record.document_type = data.get("documentType")
        kyc_record.document_number = data.get("documentNumber")
        kyc_record.document_issue_date = data.get("documentIssueDate")
        kyc_record.document_expiry_date = data.get("documentExpiryDate")
        kyc_record.document_issuing_country = data.get("documentIssuingCountry")

        # Document URLs
        kyc_record.document_front_url = document_front_url
        kyc_record.document_back_url = document_back_url
        kyc_record.selfie_url = selfie_url
        kyc_record.proof_of_address_url = proof_of_address_url

        # Financial info
        kyc_record.source_of_funds = data.get("sourceOfFunds")
        kyc_record.purpose_of_transaction = data.get("purposeOfTransaction")
        kyc_record.estimated_monthly_volume = data.get("estimatedMonthlyVolume")

        # Consent
        kyc_record.agreed_to_data_processing = data.get("agreedToDataProcessing", False)
        kyc_record.agreed_to_screening = data.get("agreedToScreening", False)

        # Transition EMPTY → PENDING
        kyc_record.kyc_status = "PENDING"
        kyc_record.kyc_submitted_at = datetime.now(timezone.utc)

        # GEMINI.md §3.2 — issue trade_mask_sid at PENDING, never regenerate
        if not user.trade_mask_sid:
            country_code = data.get("country", "XX")[:2].upper()
            date_str = datetime.now().strftime("%y%m%d")
            sid_count = db.query(User).filter(User.trade_mask_sid.isnot(None)).count()
            consecutive = f"{(sid_count + 1):04d}"
            base_sid = f"S{datetime.now().strftime('%Y%m%d')}{country_code}{consecutive}"
            checksum = iso7064_mod97_10(base_sid)
            user.trade_mask_sid = f"{base_sid}{checksum}"

        db.commit()

        return {
            "success": True,
            "message": "KYC submitted successfully",
            "kyc_status": "PENDING",
            "trade_mask_sid": user.trade_mask_sid,
            "estimated_review_time": "24-48 hours",
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting KYC: {str(e)}")


# ---------------------------------------------------------------------------
# GET /api/kyc/status
# ---------------------------------------------------------------------------
@router.get("/status")
async def get_kyc_status(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Return KYC status for the authenticated user.
    Acts as a safety-net fallback per GEMINI.md §3.2 — issues trade_mask_sid
    if a PENDING/APPROVED user somehow lacks one.
    """
    owner_id = _get_owner_id_from_token(authorization)

    try:
        kyc_record = db.query(UserKYC).filter(UserKYC.owner_id == owner_id).first()

        if not kyc_record:
            return {"kyc_status": "EMPTY", "transaction_count": 0, "total_transaction_value_usd": 0}

        # Safety-net SID issuance (GEMINI.md §3.2)
        user = db.query(User).filter(User.id == owner_id).first()
        if user and not user.trade_mask_sid and kyc_record.kyc_status in ("PENDING", "APPROVED"):
            sid_count = db.query(User).filter(User.trade_mask_sid.isnot(None)).count()
            consecutive = f"{(sid_count + 1):04d}"
            country = (kyc_record.country or "XX")[:2].upper()
            base_sid = f"S{datetime.now().strftime('%Y%m%d')}{country}{consecutive}"
            checksum = iso7064_mod97_10(base_sid)
            user.trade_mask_sid = f"{base_sid}{checksum}"
            db.commit()

        return {
            "kyc_status": kyc_record.kyc_status,
            "transaction_count": kyc_record.transaction_count,
            "total_transaction_value_usd": float(kyc_record.total_transaction_value_usd),
            "trade_mask_sid": user.trade_mask_sid if user else None,
            "kyc_submitted_at": kyc_record.kyc_submitted_at.isoformat() if kyc_record.kyc_submitted_at else None,
            "kyc_approved_at": kyc_record.kyc_approved_at.isoformat() if kyc_record.kyc_approved_at else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting KYC status: {str(e)}")


# ---------------------------------------------------------------------------
# POST /api/kyc/update-transaction-count  (internal — called by transaction logic)
# ---------------------------------------------------------------------------
@router.post("/update-transaction-count")
async def update_transaction_count(
    transaction_amount_usd: float,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Increment the authenticated user's transaction count after a completed swap.
    Called internally — identity still comes from JWT, not body.
    """
    owner_id = _get_owner_id_from_token(authorization)

    try:
        kyc_record = db.query(UserKYC).filter(UserKYC.owner_id == owner_id).first()

        if not kyc_record:
            user = db.query(User).filter(User.id == owner_id).first()
            kyc_record = UserKYC(
                owner_id=owner_id,
                symmetri_id=user.symmetri_id if user else "",
                transaction_count=0,
                total_transaction_value_usd=0,
            )
            db.add(kyc_record)

        kyc_record.transaction_count += 1
        kyc_record.total_transaction_value_usd += transaction_amount_usd
        kyc_record.last_transaction_date = datetime.now(timezone.utc)
        db.commit()

        return {
            "success": True,
            "transaction_count": kyc_record.transaction_count,
            "total_value": float(kyc_record.total_transaction_value_usd),
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating transaction count: {str(e)}")