from sqlalchemy import Column, String, Boolean, JSON, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from backend.database import Base

class InstitutionalGateway(Base):
    __tablename__ = "institutional_gateways"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    corridor_code = Column(String, index=True) # "US-MX", "MX-GT"
    rail_type = Column(String)                  # "RETAILER_API", "SPEI"
    currency = Column(String(3))                # "USD", "MXN"
    payment_details = Column(JSON)              # Stores {"provider": "Reloadly"} OR {"clabe": "..."}
    instruction_template = Column(String)       # Template with {{code}} or {{reference}}
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)
