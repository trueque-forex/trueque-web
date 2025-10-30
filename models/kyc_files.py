# trueque-web/models/kyc_files.py
from sqlalchemy import Column, Integer, Text, BigInteger, DateTime, ForeignKey
from datetime import datetime
from .base import Base

class KycFile(Base):
    __tablename__ = "kyc_files"
    id = Column(Integer, primary_key=True, autoincrement=True)
    submission_id = Column(Integer, ForeignKey("kyc_submissions.id"), index=True)
    logical_name = Column(Text)          # passport_front, selfie
    storage_key = Column(Text, nullable=False)  # s3 key or object id
    content_type = Column(Text)
    size_bytes = Column(BigInteger)
    uploaded_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)