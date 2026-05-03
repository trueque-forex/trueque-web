from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, JSON
from backend.database import Base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
import uuid

class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Retailer info (e.g., 'SORIANA', 'OXXO')
    retailer_name = Column(String, nullable=False)
    
    # The actual digital code or QR data returned by the Wholesaler API
    voucher_code = Column(String, nullable=False, unique=True)
    
    # Financials (Using our Gross/Net precision)
    amount_mxn = Column(Numeric(precision=20, scale=4), nullable=False)
    cost_usd = Column(Numeric(precision=20, scale=4), nullable=False) # Your 15% discounted cost
    
    status = Column(String, default="active") # 'active', 'redeemed', 'expired'
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Store any extra metadata from the Wholesaler API
    api_metadata = Column(JSON, nullable=True)