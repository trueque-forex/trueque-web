from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from backend.database import Base
from datetime import datetime

class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    uuid = Column(String, nullable=False, unique=True)
    country = Column(String, nullable=False)
    currency_from = Column(String, nullable=False)
    currency_to = Column(String, nullable=False)
    amount_from = Column(Numeric(18, 6), nullable=False)
    amount_to = Column(Numeric(18, 6), nullable=False)
    amount = Column(Numeric(18, 6), nullable=False)
    market_rate = Column(Numeric(18, 6), nullable=False)
    status = Column(String, default="open")
    matched_offer_id = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Compliance Metadata
    remittance_purpose = Column(String, nullable=True) # e.g. FAMILY_SUPPORT
    sender_ip = Column(String, nullable=True)
    device_fingerprint = Column(String, nullable=True)