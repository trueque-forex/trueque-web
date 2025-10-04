from backend.utils.match_utils import is_match
from backend.models.advance_model import Advance
from sqlalchemy.orm import Session
from typing import Optional

def find_match_for_advance(db: Session, advance: Advance, market_rate: float, tolerance_pct: float = 2.5) -> Optional[Advance]:
    """
    Scans for a counterparty advance that matches the given advance.
    Anchored to market_rate with tolerance.
    """
    candidates = db.query(Advance).filter(Advance.uuid != advance.uuid).all()

    for candidate in candidates:
        if is_match(advance, candidate, market_rate, tolerance_pct):
            return candidate

    return None