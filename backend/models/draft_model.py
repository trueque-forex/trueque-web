from backend.database import Base
from sqlalchemy import Column, String, DateTime, JSON, Text
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)
    # Step: 'amount', 'beneficiary', 'review'
    step = Column(String, default="amount")
    # JSON Blob for flexible storage (amount, currency, partial beneficiary data)
    data = Column(JSON, default={})
    status = Column(String, default="active") # active, converted, abandoned
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
