# backend/routes/advance.py
#
# Advance creation endpoint.
# The institutional gateway (InstitutionalGateway) handles actual fund delivery —
# Symmetri never holds or advances funds itself (GEMINI.md §3 — Zero Custody).
# Identity read from JWT (GEMINI.md §5). owner_id used throughout (§2.2).
import traceback
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.user import User                        # was: backend.models.user_model (ghost)
from backend.models.advance_model import Advance
from backend.models.gateway import InstitutionalGateway
from backend.schemas.advance_schema import AdvanceRequest
from backend.utils.pin_utils import verify_pin

router = APIRouter()


@router.post("/advance")
def create_advance(
    request: AdvanceRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Record an advance request and resolve the appropriate institutional gateway.

    Symmetri's role: orchestrator only.
    - Validates the authenticated user and their PIN.
    - Verifies the market rate tolerance (±1%).
    - Looks up the active InstitutionalGateway for the requested corridor.
    - Persists the Advance record with gateway_id for downstream fulfillment.

    GEMINI.md §3 — Zero Custody: Symmetri never holds funds.
    The gateway (e.g. Reloadly, SPEI) is the entity that actually delivers value.
    """
    try:
        from backend.routes.kyc import _get_owner_id_from_token
        owner_id = _get_owner_id_from_token(authorization)

        # Resolve the authenticated user
        user = db.query(User).filter(User.id == owner_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Validate transaction PIN
        if not user.pin_hash:
            raise HTTPException(
                status_code=403,
                detail="Transaction PIN not set — please set a PIN before creating an advance",
            )
        if not verify_pin(request.pin, user.pin_hash):
            raise HTTPException(status_code=401, detail="Invalid PIN")

        # Validate market rate tolerance (±1%)
        # Protects against stale-rate replay attacks on the advance endpoint
        expected_to = request.amount_from * request.market_rate
        tolerance = expected_to * Decimal("0.01")
        if abs(expected_to - request.amount_to) > tolerance:
            raise HTTPException(
                status_code=400,
                detail=f"Amount mismatch with market rate (expected ~{expected_to:.4f}, got {request.amount_to})",
            )

        # Resolve institutional gateway for this corridor (e.g. "US-MX")
        # GEMINI.md §3 — gateway handles actual delivery; we record the reference only
        corridor_code = f"{request.currency_from[:2]}-{request.country.upper()}"
        gateway = db.query(InstitutionalGateway).filter(
            InstitutionalGateway.corridor_code == corridor_code,
            InstitutionalGateway.is_active == True,
        ).first()

        if not gateway:
            raise HTTPException(
                status_code=503,
                detail=f"No active gateway found for corridor {corridor_code}",
            )

        # Persist the advance record
        advance = Advance(
            owner_id=owner_id,          # GEMINI.md §2.2 — never user_id
            uuid=request.uuid,
            country=request.country,
            currency_from=request.currency_from,
            currency_to=request.currency_to,
            amount_from=request.amount_from,
            amount_to=request.amount_to,
            amount=request.amount,
            market_rate=request.market_rate,
            gateway_id=gateway.id,
            status="PENDING",
        )
        db.add(advance)
        db.commit()
        db.refresh(advance)

        return {
            "status": "success",
            "message": "Advance recorded — gateway fulfillment pending",
            "uuid": str(request.uuid),
            "gateway_corridor": corridor_code,
            "gateway_rail": gateway.rail_type,
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")


# Local import needed for rate tolerance calculation
from decimal import Decimal