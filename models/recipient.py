# trueque-web/models/recipient.py
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from datetime import datetime
from .base import Base

class RecipientProfile(Base):
    __tablename__ = "recipient_profiles"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    sender_email = Column(Text)
    recipient_name = Column(Text)
    origin_country = Column(Text)
    destination_country = Column(Text)
    delivery_method = Column(Text)   # wallet, bank, cash, mobile_money
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)