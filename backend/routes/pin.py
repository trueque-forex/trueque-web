# backend/routes/pin.py
#
# PIN setup for in-app transaction authorization.
# Identity read from JWT session (GEMINI.md §5) — never from request body.
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user import User          # was: backend.models.user_model (ghost)
from backend.utils.pin_utils import safe_hash  # was: hash_pin — use the correct exported name

router = APIRouter()


@router.post("/pin/setup")
def setup_pin(
    pin: str,
    authorization: str = Header(...),
    db: Session = Depends(get_db),
):
    """
    Set or update the authenticated user's transaction PIN.
    Identity comes from JWT — not from a request body user_id (GEMINI.md §2.2).
    """
    import uuid as _uuid
    from backend.routes.kyc import _get_owner_id_from_token
    owner_id = _get_owner_id_from_token(authorization)

    user = db.query(User).filter(User.id == owner_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.pin_hash = safe_hash(pin)
    db.commit()
    return {"status": "PIN set successfully"}