# trueque-web/models/kyc_audit.py
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, JSON
from datetime import datetime
from .base import Base

class KycAudit(Base):
    __tablename__ = "kyc_audit"
    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey("kyc_submissions.id"), index=True)
    event_type = Column(Text, nullable=False)    # e.g., submission_created, provider_accepted
    actor = Column(Text)                          # system, user, provider
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

class KycAuditLog(Base):
    __tablename__ = "kyc_audit_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    submission_id = Column(Integer, ForeignKey("kyc_submissions.id"), index=True)
    event_type = Column(Text, nullable=False)    # field_edited, file_uploaded, etc.
    payload = Column(JSONB)                      # details: field names, old/new, file metadata
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)