from sqlalchemy import Column, String, DateTime, JSON, Text
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class Draft(Base):
    __tablename__ = "drafts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False, index=True)
    # Step: 'amount', 'beneficiary', 'review'
    step = Column(String, default="amount")
    # JSON Blob for flexible storage (amount, currency, partial beneficiary data)
    data = Column(JSON, default={})
    status = Column(String, default="active") # active, converted, abandoned
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
