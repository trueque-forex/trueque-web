from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.user_model import User
from backend.models.advance_model import Advance
from backend.schemas.advance_schema import AdvanceRequest
from backend.utils.pin_utils import verify_pin
import traceback

router = APIRouter()

@router.post("/advance")
def create_advance(request: AdvanceRequest, db: Session = Depends(get_db)):
    try:
        # 🧾 Log incoming payload
        print("Advance payload received:", request.dict())

        # 🔍 Lookup user
        user = db.query(User).filter(User.id == request.user_id).first()
        print("User lookup result:", user)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        print("User PIN hash:", user.pin_hash)

        # 🔐 Validate PIN
        if not verify_pin(request.pin, user.pin_hash):
            raise HTTPException(status_code=401, detail="Invalid PIN")

        # 🧮 Validate market rate
        expected_to = request.amount_from * request.market_rate
        tolerance = 0.01
        if abs(expected_to - request.amount_to) > tolerance:
            raise HTTPException(status_code=400, detail="Amount mismatch with market rate")

        # 💾 Create advance record
        advance = Advance(
            user_id=request.user_id,
            uuid=request.uuid,
            country=request.country,
            currency_from=request.currency_from,
            currency_to=request.currency_to,
            amount_from=request.amount_from,
            amount_to=request.amount_to,
            amount=request.amount,
            market_rate=request.market_rate
        )
        db.add(advance)
        db.commit()
        db.refresh(advance)

        # ✅ Return success response
        return {
            "status": "success",
            "message": "Advance recorded",
            "uuid": request.uuid
        }

    except Exception as e:
        print("Unhandled exception in /advance:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")