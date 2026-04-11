from sqlalchemy import Column, String, Float, DateTime, Numeric, Integer, Text, TIMESTAMP, JSON, Boolean
from datetime import datetime
from backend.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    owner_id = Column(String, nullable=False, index=True)
    amount = Column(Numeric(precision=20, scale=4), nullable=False)
    currency = Column(String, nullable=False)
    status = Column(String, default="pending")
    type = Column(String, default="SWAP")
    description = Column(Text, nullable=True)
    beneficiary_id = Column(String, nullable=True)
    exchange_rate = Column(Numeric(precision=20, scale=8), nullable=True)
    amount_received = Column(Numeric(precision=20, scale=4), nullable=True)
    currency_received = Column(String, nullable=True)
    total_cost = Column(Numeric(precision=20, scale=4), nullable=True)
    fee_details = Column(JSON, nullable=True)
    fee = Column(Numeric(precision=10, scale=2), default=0.00)
    vendor_id = Column(String, nullable=True)
    payout_rail = Column(String, nullable=True)
    inbound_verified = Column(Boolean, default=False)
    handshake_expires_at = Column(TIMESTAMP(timezone=True), nullable=True)

class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    id = Column(String, primary_key=True)
    owner_id = Column(String, nullable=True, index=True)
    name = Column(Text, nullable=False, index=True)
    account_type = Column(String, nullable=False, default="bank")
    account_identifier = Column(Text, nullable=False)
    email = Column(String, nullable=True, index=True)
    phone_number = Column(String, nullable=True, index=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=True)
