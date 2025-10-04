from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from backend.models.transaction import Base  # ✅ Shared Base

class Advance(Base):
    __tablename__ = "advances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    uuid = Column(String, unique=True, nullable=False)
    country = Column(String, nullable=False)
    currency_from = Column(String, nullable=False)
    currency_to = Column(String, nullable=False)
    amount_from = Column(Float, nullable=False)
    amount_to = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    market_rate = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)  # ✅ Timestamp for audit trail

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
