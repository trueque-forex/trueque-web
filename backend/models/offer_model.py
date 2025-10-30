from sqlalchemy import Column, Integer, String, Float, DateTime
from backend.database import Base
from datetime import datetime

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    uuid = Column(String, nullable=False, unique=True)
    country = Column(String, nullable=False)
    currency_from = Column(String, nullable=False)
    currency_to = Column(String, nullable=False)
    amount_from = Column(Float, nullable=False)
    amount_to = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    market_rate = Column(Float, nullable=False)
    status = Column(String, default="open")
    matched_offer_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)