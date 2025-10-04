from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"

    tx_id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    from_currency = Column(String, nullable=False)
    to_currency = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="confirmed")