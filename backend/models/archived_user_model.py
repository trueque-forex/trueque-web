
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.database import Base
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

class ArchivedUser(Base):
    __tablename__ = "archived_users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    original_user_id = Column(PG_UUID(as_uuid=True), nullable=False) # UUID
    full_name = Column(String, nullable=True)
    kyc_data_snapshot = Column(Text, nullable=True) # JSON dump of encrypted PII
    archived_at = Column(DateTime, default=datetime.utcnow)
    retention_until = Column(DateTime, nullable=False) # 5 years later
    reason = Column(String, default="USER_DELETION")
