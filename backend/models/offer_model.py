from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, TIMESTAMP, JSON
from backend.database import Base
from datetime import datetime

class Offer(Base):
    __tablename__ = "offers"

    # Use String for the ID as the DB uses UUID strings
    id = Column(String, primary_key=True) 
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
    user_id = Column(String, nullable=False, index=True)
    swap_type = Column(String, default="SYNTHETIC")
    amount_offered = Column(Numeric(precision=20, scale=4), nullable=False)
    currency_offered = Column(String, nullable=False)
    amount_wanted = Column(Numeric(precision=20, scale=4), nullable=False)
    currency_wanted = Column(String, nullable=False)
    exchange_rate = Column(Numeric(precision=20, scale=8), nullable=False)
    fee_total = Column(Numeric(precision=20, scale=4), nullable=True)
    fee_details = Column(JSON, nullable=True)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=True)
    status = Column(String, default="open")
    is_public = Column(Boolean, default=True)