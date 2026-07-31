from sqlalchemy import Column, String, Numeric, DateTime, Boolean, ForeignKey
from backend.database import Base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
import uuid

class InventoryVoucher(Base):
    __tablename__ = "inventory_vouchers"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    retailer_id = Column(String, nullable=False, index=True)
    barcode_data = Column(String, nullable=False, unique=True)
    
    value_amount = Column(Numeric(precision=20, scale=4), nullable=False)
    currency = Column(String, nullable=False, default="USD")
    
    is_allocated = Column(Boolean, default=False, index=True)
    
    # Quarantine Protocol fields
    is_voided = Column(Boolean, default=False, index=True)
    voided_reason = Column(String, nullable=True)
    
    allocated_to_owner_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    transaction_id = Column(PG_UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    allocated_at = Column(DateTime, nullable=True)
