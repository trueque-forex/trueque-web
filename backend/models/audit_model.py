from sqlalchemy import Column, Integer, String, Float, DateTime
from backend.database import Base
from datetime import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, nullable=False)
    matched_offer_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=False)
    counterparty_id = Column(Integer, nullable=True)
    market_rate = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    currency_from = Column(String, nullable=False)
    currency_to = Column(String, nullable=False)
    country = Column(String, nullable=False)
    status = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)