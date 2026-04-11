from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    country = Column(String)
    currency_from = Column(String)
    currency_to = Column(String)
    amount = Column(Numeric(18, 6))
    market_rate = Column(Numeric(18, 6))
    status = Column(String, default="pending")
    timestamp = Column(DateTime, default=datetime.utcnow)

    # 🧾 Dispute tracking
    dispute_reason = Column(Text, nullable=True)
    dispute_timestamp = Column(DateTime, nullable=True)

    # ✅ Settlement tracking
    settlement_timestamp = Column(DateTime, nullable=True)
    confirmed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
