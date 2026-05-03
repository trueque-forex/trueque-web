from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, TIMESTAMP, JSON, ForeignKey
from backend.database import Base
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

class Offer(Base):
    __tablename__ = "offers"

    # Use PG_UUID for IDs in native PostgreSQL
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4) 
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    swap_type = Column(String, default="SYNTHETIC")
    amount = Column(Numeric(precision=20, scale=4), nullable=False)
    source_currency = Column(String, nullable=False)
    amount_received = Column(Numeric(precision=20, scale=4), nullable=False)
    target_currency = Column(String, nullable=False)
    exchange_rate = Column(Numeric(precision=20, scale=8), nullable=False)
    fee_total = Column(Numeric(precision=20, scale=4), nullable=True)
    fee_details = Column(JSON, nullable=True)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=True)
    status = Column(String, default="open")
    is_public = Column(Boolean, default=True)