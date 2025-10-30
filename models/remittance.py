# trueque-web/models/remittance.py
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, Numeric, Text, DateTime, ForeignKey, Boolean
from datetime import datetime
from .base import Base

class Transfer(Base):
    __tablename__ = "transfers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    recipient_id = Column(Integer, ForeignKey("recipient_profiles.id"))
    amount = Column(Numeric(18,6), nullable=False)     # sender amount
    currency = Column(Text, nullable=False)
    tx_id = Column(Text, unique=True, index=True)      # ledger / external reference
    status = Column(Text, index=True)                  # created, confirmed, sent, failed
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    finalized_at = Column(DateTime(timezone=True))

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    id = Column(Integer, primary_key=True, autoincrement=True)
    corridor = Column(Text, index=True)    # e.g., USD-NGN
    rate = Column(Numeric(24,12), nullable=False)
    source = Column(Text)
    fixed_window_minutes = Column(Integer, default=0)
    captured_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

class LiquidityOffer(Base):
    __tablename__ = "liquidity_offers"
    id = Column(Integer, primary_key=True, autoincrement=True)
    recipient_country = Column(Text)
    amount = Column(Numeric(18,6))
    currency = Column(Text)
    delivery_method = Column(Text)
    offer_expiry = Column(DateTime(timezone=True))