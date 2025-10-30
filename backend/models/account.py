from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime
from models.transaction import Base

class Account(Base):
    __tablename__ = "accounts"
    account_id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    currency = Column(String)
    account_number = Column(String)
    institution = Column(String)
    method = Column(String)  # e.g. "ACH", "card", "instant"

# for preferred destination
is_default = Column(Boolean, default=False)  # for preferred destination