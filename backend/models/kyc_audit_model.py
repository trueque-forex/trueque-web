from sqlalchemy import Column, Integer, String, DateTime
from backend.database import Base
from datetime import datetime, timezone

class KYCAuditLog(Base):
    __tablename__ = "kyc_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, nullable=False) # User ID (or ref to users.id)
    action = Column(String, nullable=False) # e.g. "STATUS_CHANGE", "TIER_UPDATE"
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    actor = Column(String, default="SYSTEM") # "SYSTEM", "ADMIN", "USER"
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
