from backend.database import Base
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
import uuid

class Account(Base):
    __tablename__ = "accounts"
    account_id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"))
    currency = Column(String)
    account_number = Column(String)
    institution = Column(String)
    method = Column(String)  # e.g. "ACH", "card", "instant"
    # for preferred destination
    is_default = Column(Boolean, default=False)