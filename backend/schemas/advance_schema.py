from pydantic import BaseModel

class AdvanceRequest(BaseModel):
    user_id: int
    uuid: str
    country: str
    currency_from: str
    currency_to: str
    amount_from: float
    amount_to: float
    amount: float
    market_rate: float
    pin: str