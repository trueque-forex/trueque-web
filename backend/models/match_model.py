from backend.database import Base
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from decimal import Decimal


class MatchRequest(BaseModel):
    corridor: str
    amount: Decimal
    payment_method: str
    delivery_speed: str
    beneficiary_country: str
    beneficiary_account_type: str


class MatchResponse(BaseModel):
    uuid: UUID
    counterparty_uuid: UUID
    market_rate_used: Decimal
    rate_source: str
    rate_fallback: bool
    rate_reason: str
    timestamp: datetime


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = {'extend_existing': True}

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offer_id = Column(PG_UUID(as_uuid=True), ForeignKey("offers.id"), nullable=True)
    status = Column(String, default="CREATED", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Participants
    user_a_id = Column(PG_UUID(as_uuid=True), nullable=False)
    user_b_id = Column(PG_UUID(as_uuid=True), nullable=True)  # Nullable until matched
    user_a_status = Column(String, default="PENDING_FUNDING")
    user_b_status = Column(String, default="PENDING_FUNDING")

    # Economics
    amount = Column(Numeric(precision=20, scale=4), nullable=False)
    source_currency = Column(String, nullable=False)
    target_currency = Column(String, nullable=True)
    exchange_rate = Column(Numeric(precision=20, scale=8), nullable=True)

    # Lifecycle
    payouts_triggered = Column(Boolean, default=False)
    rate_locked_at = Column(DateTime(timezone=True), nullable=True)