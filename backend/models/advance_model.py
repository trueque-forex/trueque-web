from backend.database import Base
from sqlalchemy import Column, Integer, String, Float, DateTime, Numeric
from datetime import datetime
from backend.database import Base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

class Advance(Base):
    __tablename__ = "advances"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), nullable=False)
    uuid = Column(PG_UUID(as_uuid=True), unique=True, nullable=False)
    country = Column(String, nullable=False)
    currency_from = Column(String, nullable=False)
    currency_to = Column(String, nullable=False)
    amount_from = Column(Numeric(18, 6), nullable=False)
    amount_to = Column(Numeric(18, 6), nullable=False)
    amount = Column(Numeric(18, 6), nullable=False)
    market_rate = Column(Numeric(18, 6), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)  # ✅ Timestamp for audit trail

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
