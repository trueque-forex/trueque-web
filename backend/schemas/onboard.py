from pydantic import BaseModel
from typing import List

class AccountInput(BaseModel):
    currency: str
    account_number: str
    institution: str
    method: str  # e.g. "ACH", "card", "instant"


class OnboardRequest(BaseModel):
    user_id: str
    name: str
    email: str
    accounts: List[AccountInput]