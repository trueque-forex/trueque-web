from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class MatchRequest(BaseModel):
    corridor: str
    amount: float
    payment_method: str
    delivery_speed: str
    beneficiary_country: str
    beneficiary_account_type: str

class MatchResponse(BaseModel):
    uuid: UUID
    counterparty_uuid: UUID
    market_rate_used: float
    rate_source: str
    rate_fallback: bool
    rate_reason: str
    timestamp: datetime