from sqlalchemy import Column, Integer, String, DateTime
from backend.database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    country = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    kyc_tier = Column(Integer, default=0) # 0=Trust($200), 1=Std($3k), 2=Unl
    kyc_status = Column(String, default="PENDING") # "PENDING", "APPROVED", "REJECTED"
    user_type = Column(String, default="PEER") # "PEER", "MERCHANT"
    

    # 🔐 Centralized PIN logic
    pin_hash = Column(String, nullable=True)