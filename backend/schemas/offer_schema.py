from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class OfferCreate(BaseModel):
    user_id: str = Field(..., description="ID of the user submitting the offer")
    uuid: str = Field(..., description="Unique identifier for the offer")
    country: str = Field(..., description="Country code (e.g., 'CO', 'US')")
    currency_from: str = Field(..., description="Currency being sent (e.g., 'COP')")
    currency_to: str = Field(..., description="Currency being received (e.g., 'USD')")
    amount_from: Decimal = Field(..., description="Amount being sent")
    amount_to: Decimal = Field(..., description="Amount expected to receive")
    amount: Decimal = Field(..., description="Anchor amount for matching logic", decimal_places=6)
    market_rate: Optional[Decimal] = Field(None, description="Optional market rate override")
    
    # Compliance
    # Compliance
    remittance_purpose: Optional[str] = Field(None, description="Purpose of remittance")
    sender_ip: Optional[str] = Field(None, description="Client IP")
    device_fingerprint: Optional[str] = Field(None, description="Device Fingerprint")

    # Routing / Addressing
    recipient_alias: Optional[str] = Field(None, description="CBU Alias (Argentina)")
    recipient_pix_key: Optional[str] = Field(None, description="Pix Key (Brazil/Mexico/Columbia)")
