from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Float
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import datetime, timezone

class InternalWallet(Base):
    __tablename__ = "internal_wallets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    currency = Column(String, default="USD") # Base settlement currency
    balance = Column(Float, default=0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", backref="wallet")
