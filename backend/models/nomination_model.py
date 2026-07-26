from sqlalchemy import Column, String, DateTime, ForeignKey
from backend.database import Base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
import uuid

class UserNomination(Base):
    __tablename__ = "user_nominations"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    
    requested_retailer = Column(String, nullable=False)
    country = Column(String, nullable=False)
    
    status = Column(String, default="pending", index=True) # pending, contacted, partnered
    
    created_at = Column(DateTime, default=datetime.utcnow)
