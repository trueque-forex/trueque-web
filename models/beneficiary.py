# trueque_web/models/beneficiary.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, TIMESTAMP
from sqlalchemy.sql import func

from .base import Base

def gen_uuid_str():
    return str(uuid.uuid4())

class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    # use string UUIDs to match existing simple-string style in other models
    id = Column(String, primary_key=True, default=gen_uuid_str)
    user_id = Column(String, nullable=True, index=True)
    name = Column(Text, nullable=False, index=True)
    account_type = Column(String, nullable=False, default="bank")
    account_identifier = Column(Text, nullable=False)
    email = Column(String, nullable=True, index=True)
    phone_number = Column(String, nullable=True, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=True)