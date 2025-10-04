from pydantic import BaseModel, Field
from typing import Optional

class OfferCreate(BaseModel):
    user_id: int = Field(..., description="ID of the user submitting the offer")
    uuid: str = Field(..., description="Unique identifier for the offer")
    country: str = Field(..., description="Country code (e.g., 'CO', 'US')")
    currency_from: str = Field(..., description="Currency being sent (e.g., 'COP')")
    currency_to: str = Field(..., description="Currency being received (e.g., 'USD')")
    amount_from: float = Field(..., description="Amount being sent")
    amount_to: float = Field(..., description="Amount expected to receive")
    amount: float = Field(..., description="Anchor amount for matching logic")
    market_rate: Optional[float] = Field(None, description="Optional market rate override")
