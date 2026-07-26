from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.models.nomination_model import UserNomination
from backend.models.user import User
import uuid

router = APIRouter(prefix="/api/retailers", tags=["Retailers"])

class NominateRequest(BaseModel):
    owner_id: str
    requested_retailer: str
    country: str

class NominateResponse(BaseModel):
    message: str
    nomination_id: str

@router.post("/nominate", response_model=NominateResponse)
def nominate_retailer(req: NominateRequest, db: Session = Depends(get_db)):
    try:
        owner_uuid = uuid.UUID(req.owner_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid owner_id format")

    # Validate user exists
    user = db.query(User).filter(User.id == owner_uuid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent spamming the exact same retailer
    existing = db.query(UserNomination).filter(
        UserNomination.owner_id == owner_uuid,
        UserNomination.requested_retailer.ilike(req.requested_retailer),
        UserNomination.country == req.country
    ).first()

    if existing:
        # Return success anyway so UI doesn't crash, but don't double count
        return NominateResponse(message="Already nominated", nomination_id=str(existing.id))

    new_nomination = UserNomination(
        owner_id=owner_uuid,
        requested_retailer=req.requested_retailer,
        country=req.country,
        status="pending"
    )
    
    db.add(new_nomination)
    db.commit()
    db.refresh(new_nomination)

    return NominateResponse(
        message="Nomination successfully recorded",
        nomination_id=str(new_nomination.id)
    )

@router.get("/nominations/stats")
def get_nomination_stats(db: Session = Depends(get_db)):
    """
    Returns aggregation of nominations by retailer for B2B dashboards.
    """
    results = db.query(
        UserNomination.requested_retailer,
        UserNomination.country,
        func.count(UserNomination.id).label('nomination_count')
    ).group_by(
        UserNomination.requested_retailer,
        UserNomination.country
    ).order_by(
        func.count(UserNomination.id).desc()
    ).all()

    stats = []
    for row in results:
        stats.append({
            "retailer": row.requested_retailer,
            "country": row.country,
            "count": row.nomination_count
        })

    return {"stats": stats}
