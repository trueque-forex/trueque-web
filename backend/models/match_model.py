from pydantic import BaseModel
from datetime import datetime


class MatchResponse(BaseModel):
    uuid: str
    counterparty_uuid: str
    market_rate_used: float
    rate_source: str
    rate_fallback: bool
    rate_reason: str | None = None
    timestamp: datetime