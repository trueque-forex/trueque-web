# backend/utils/fallback_utils.py

from backend.models.daily_rate import DailyRate
from sqlalchemy.orm import Session

def get_last_valid_rate(base: str, target: str, session: Session) -> tuple[float, str]:
    """
    Retrieves the most recent valid exchange rate from daily_rates table.
    Returns (rate, date) tuple.
    """
    result = (
        session.query(DailyRate)
        .filter_by(base_currency=base, target_currency=target)
        .order_by(DailyRate.date.desc())
        .first()
    )
    if result:
        return result.rate, result.date.isoformat()
    else:
        raise ValueError(f"No fallback rate found for {base} → {target}")