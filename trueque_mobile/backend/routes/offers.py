from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime

from backend.schemas.offer_schema import NewOffer, OfferResponse
from backend.database import SessionLocal
from backend.models.offer_model import Offer
from lib.services.matching import find_best_match

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Market rate placeholder (replace with real API later)
def get_market_rate(currency_from: str, currency_to: str) -> float:
    if currency_from == "COP" and currency_to == "USD":
        return 4000.0
    if currency_from == "USD" and currency_to == "COP":
        return 0.00025
    return 1.0

# Create offer endpoint
@router.post("/offers", response_model=OfferResponse)
def create_offer(offer: NewOffer, db: Session = Depends(get_db)):
    market_rate = get_market_rate(offer.currency_from, offer.currency_to)
    new_offer = Offer(**offer.dict(), market_rate=market_rate, status="open", timestamp=datetime.utcnow())
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)

    match = find_best_match(db, new_offer)
    matched_id = None

    if match:
        new_offer.status = "matched"
        match.status = "matched"
        db.commit()
        matched_id = match.id

    return OfferResponse(
        id=new_offer.id,
        status=new_offer.status,
        matched_offer_id=matched_id,
        market_rate=market_rate
    )

# Settle offer endpoint
@router.post("/settle/{offer_id}")
def settle_offer(offer_id: int, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer or offer.status != "matched":
        raise HTTPException(status_code=400, detail="Offer not matched or not found")

    offer.status = "settled"
    db.commit()
    return {"status": "settled", "offer_id": offer.id}

# Simulate full flow: create → match → settle
@router.post("/advance", response_model=OfferResponse, tags=["Diagnostics"])
def simulate_advance_flow(offer: NewOffer = Body(...), db: Session = Depends(get_db)):
    market_rate = get_market_rate(offer.currency_from, offer.currency_to)
    new_offer = Offer(**offer.dict(), market_rate=market_rate, status="open", timestamp=datetime.utcnow())
    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)

    match = find_best_match(db, new_offer)
    matched_id = None

    if match:
        new_offer.status = "matched"
        match.status = "matched"
        db.commit()
        matched_id = match.id

        new_offer.status = "settled"
        db.commit()

    return OfferResponse(
        id=new_offer.id,
        status=new_offer.status,
        matched_offer_id=matched_id,
        market_rate=market_rate
    )

# Ping endpoint for diagnostics
@router.get("/advance", tags=["Diagnostics"])
def advance_ping():
    return {"status": "advance flow reachable"}