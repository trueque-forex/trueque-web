
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.database import Base
from datetime import datetime, timezone

class ArchivedUser(Base):
    __tablename__ = "archived_users"

    id = Column(Integer, primary_key=True, index=True)
    original_user_id = Column(String, nullable=False) # UUID/Int
    full_name = Column(String, nullable=True)
    kyc_data_snapshot = Column(Text, nullable=True) # JSON dump of encrypted PII
    archived_at = Column(DateTime, default=datetime.utcnow)
    retention_until = Column(DateTime, nullable=False) # 5 years later
    reason = Column(String, default="USER_DELETION")
