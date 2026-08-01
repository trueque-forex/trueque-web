# backend/schemas/advance_schema.py
#
# Request/response schemas for the /advance endpoint.
# user_id is BANNED as a request field (GEMINI.md §2.2).
# Identity is read from the JWT session in the route handler.
import uuid
from pydantic import BaseModel, Field
from decimal import Decimal


class AdvanceRequest(BaseModel):
    """
    Payload for POST /advance.
    The authenticated user's identity comes from the JWT Authorization header —
    it must NOT be passed in the request body (GEMINI.md §5).
    """
    uuid: str = Field(..., description="Client-generated idempotency UUID for this advance")
    country: str = Field(..., description="2-letter ISO country code of the destination")
    currency_from: str = Field(..., description="ISO 4217 source currency code")
    currency_to: str = Field(..., description="ISO 4217 destination currency code")
    amount_from: Decimal = Field(..., gt=0, description="Amount the sender is sending")
    amount_to: Decimal = Field(..., gt=0, description="Amount the beneficiary will receive")
    amount: Decimal = Field(..., gt=0, description="Principal amount in source currency")
    market_rate: Decimal = Field(..., gt=0, description="Mid-market rate at time of request")
    pin: str = Field(..., description="User's transaction PIN for action authorization")