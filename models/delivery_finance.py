# trueque-web/models/delivery_finance.py
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, Numeric, Text, DateTime, ForeignKey
from datetime import datetime
from .base import Base

class DeliveryEvent(Base):
    __tablename__ = "delivery_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    recipient_id = Column(Integer, ForeignKey("recipient_profiles.id"))
    delivery_agent_code = Column(Text)
    delivery_method = Column(Text)
    agent_reference_id = Column(Text)
    agent_fee = Column(Numeric(18,6))
    model_used = Column(Text)   # OM or MTB
    agent_status = Column(Text)
    delivered_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

class FeeBreakdown(Base):
    __tablename__ = "fee_breakdowns"
    id = Column(Integer, primary_key=True, autoincrement=True)
    transfer_id = Column(Integer, ForeignKey("transfers.id"), index=True)
    trueque_fee = Column(Numeric(18,6), nullable=False)
    transmitter_fee = Column(Numeric(18,6), nullable=False)
    total_fee = Column(Numeric(18,6), nullable=False)  # computed in app and persisted
    fee_currency = Column(Text)
    fee_source = Column(Text)
    effective_rate = Column(Numeric(24,12))
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

class RateConfirmation(Base):
    __tablename__ = "rate_confirmations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    transfer_id = Column(Integer, ForeignKey("transfers.id"))
    rate = Column(Numeric(24,12))
    fee_breakdown_id = Column(Integer, ForeignKey("fee_breakdowns.id"))
    confirmed_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)