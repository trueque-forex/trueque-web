from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from backend.database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symmetri_id = Column(String, unique=True, index=True, nullable=False)
    trade_mask_sid = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # THE FIX: Add the missing wire to Flash's Phase 2 KYC model.
    # 'overlaps' prevents SQLAlchemy from throwing warnings if Flash already defined a backref.
    kyc = relationship("UserKYC", uselist=False, overlaps="user,kyc")