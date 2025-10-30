from fastapi import APIRouter
from backend.utils.match_utils import get_market_rate
from backend.models.match_model import MatchResponse
from datetime import datetime

router = APIRouter()

@router.post("/match", response_model=MatchResponse)
def match_advance():
    rate, rate_source, rate_fallback = get_market_rate("COP", "USD")

    rate_reason = (
        "The exchange rate shown reflects the last available market snapshot, "
        "as FX markets are currently closed. This rate was retrieved from the most recent open trading day "
        "and may differ from future updates."
        if rate_fallback else "Rates are refreshed every 10 minutes to reflect market conditions."
    )

    return MatchResponse(
        uuid=advance.uuid,
        counterparty_uuid=match.uuid,
        market_rate_used=rate,
        rate_source=rate_source,
        rate_fallback=rate_fallback,
        rate_reason=rate_reason,
        timestamp=datetime.utcnow()
    )