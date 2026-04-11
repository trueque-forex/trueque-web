from pydantic import BaseModel
from decimal import Decimal

class AdvanceRequest(BaseModel):
    user_id: int
    uuid: str
    country: str
    currency_from: str
    currency_to: str
    amount_from: Decimal
    amount_to: Decimal
    amount: Decimal
    market_rate: Decimal
    pin: str