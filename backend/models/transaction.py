from sqlalchemy import Column, String, Float, DateTime, Numeric, Integer, Text, TIMESTAMP, JSON, Boolean
from datetime import datetime, timezone
from backend.database import Base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

class Transaction(Base):
    __tablename__ = "transactions"
    # Added extend_existing to ensure the change takes effect immediately
    __table_args__ = {'extend_existing': True}

    # Restored proper UUID constraints
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    user_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    amount = Column(Numeric(precision=20, scale=4), nullable=False)
    source_currency = Column(String, nullable=False)
    status = Column(String, default="pending")
    type = Column(String, default="SWAP")
    description = Column(Text, nullable=True)
    beneficiary_id = Column(PG_UUID(as_uuid=True), nullable=True)
    exchange_rate = Column(Numeric(precision=20, scale=8), nullable=True)
    amount_received = Column(Numeric(precision=20, scale=4), nullable=True)
    target_currency = Column(String, nullable=True)
    total_cost = Column(Numeric(precision=20, scale=4), nullable=True)
    fee_details = Column(JSON, nullable=True)
    fee = Column(Numeric(precision=10, scale=2), default=0.00)
    vendor_id = Column(String, nullable=True)
    payout_rail = Column(String, nullable=True)
    inbound_verified = Column(Boolean, default=False)
    handshake_expires_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # B2B Margin Tracking
    retailer_wholesale_discount_pct = Column(Numeric(precision=5, scale=4), nullable=True, default=0.00)
    symmetri_gross_margin = Column(Numeric(precision=20, scale=4), nullable=True, default=0.00)
    retailer_wholesale_margin = Column(Numeric(precision=20, scale=4), nullable=True, default=0.00)
    destination_country_code = Column(String, nullable=True)
    target_currency = Column(String, nullable=True)

class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    __table_args__ = {'extend_existing': True}

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), nullable=True, index=True)
    name = Column(Text, nullable=False, index=True)
    account_type = Column(String, nullable=False, default="bank")
    account_identifier = Column(Text, nullable=False)
    email = Column(String, nullable=True, index=True)
    phone_number = Column(String, nullable=True, index=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(TIMESTAMP(timezone=True), nullable=True)
    historical_redemption_anchor = Column(JSON, nullable=True)