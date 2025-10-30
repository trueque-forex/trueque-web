# trueque-web/models/kyc.py
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy import Column, Integer, ForeignKey, Text, Date, Index, JSON, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from .base import Base

class UserKycStatus(Base):
    __tablename__ = "user_kyc_status"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    kyc_status = Column(Text, nullable=False, index=True)  # e.g., pending, verified, rejected
    kyc_tier = Column(Text)
    kyc_verified_at = Column(DateTime(timezone=True))
    last_submission_id = Column(Integer)

class KycSubmission(Base):
    __tablename__ = "kyc_submissions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    provider_job_id = Column(Text, index=True)   # external provider reference
    payload = Column(JSONB, nullable=False)      # raw submission
    # Extracted columns for common queries
    full_name = Column(Text, index=True)
    dob = Column(Date)
    document_type = Column(Text, index=True)
    document_number = Column(Text, index=True)
    country_of_issue = Column(Text)
    form_version = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

Index("ix_kyc_submissions_user_id_created", KycSubmission.user_id, KycSubmission.created_at)