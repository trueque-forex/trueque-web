from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from backend.database import Base
from datetime import datetime, timezone
import uuid

class Dispute(Base):
    __tablename__ = 'disputes'

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    offer_id = Column(PG_UUID(as_uuid=True), ForeignKey("offers.id"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String, default="open")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
