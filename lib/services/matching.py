from sqlalchemy.orm import Session
from backend.models.offer_model import Offer

# Country-specific tolerance thresholds
TOLERANCE_BY_COUNTRY = {
    "CO": 0.05,
    "US": 0.02,
    "MX": 0.03,
    # Add more countries as needed
}

def find_best_match(db: Session, new_offer: Offer) -> Offer | None:
    if not all([
        new_offer.currency_from,
        new_offer.currency_to,
        new_offer.amount_to,
        new_offer.country
    ]):
        print("Missing required fields in new_offer")
        return None

    tolerance = TOLERANCE_BY_COUNTRY.get(new_offer.country, 0.0)

    try:
        min_amount = new_offer.amount_to * (1 - tolerance)
        max_amount = new_offer.amount_to * (1 + tolerance)
    except TypeError:
        print("Invalid amount_to value in new_offer")
        return None

    print(f"\n🔍 Matching new offer:")
    print(f"→ Wants to receive: {new_offer.amount_to} {new_offer.currency_to}")
    print(f"→ Acceptable range: {min_amount:.2f} to {max_amount:.2f}")
    print(f"→ Looking for: {new_offer.currency_to} → {new_offer.currency_from}")

    candidates = db.query(Offer).filter(
        Offer.status == "open",
        Offer.currency_from == new_offer.currency_to,
        Offer.currency_to == new_offer.currency_from,
        Offer.amount_from >= min_amount,
        Offer.amount_from <= max_amount
    ).order_by(Offer.timestamp.asc()).all()

    print(f"→ Found {len(candidates)} matching candidates\n")

    return candidates[0] if candidates else None