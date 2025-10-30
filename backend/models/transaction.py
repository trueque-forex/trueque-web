<<<<<<< HEAD
from sqlalchemy import Column, String, Float, DateTime
=======
from sqlalchemy import Column, String, Float, DateTime, Text, TIMESTAMP
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"

    tx_id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    from_currency = Column(String, nullable=False)
    to_currency = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    rate = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
<<<<<<< HEAD
    status = Column(String, default="confirmed")
=======
    status = Column(String, default="confirmed")

class Beneficiary(Base):
    __tablename__ = "beneficiaries"

    # Primary key as string to match the simple style used in Transaction.
    # If you prefer UUIDs, change to UUID and ensure users.id model type matches.
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True, index=True)
    name = Column(Text, nullable=False, index=True)
    account_type = Column(String, nullable=False, default="bank")
    account_identifier = Column(Text, nullable=False)
    email = Column(String, nullable=True, index=True)
    phone_number = Column(String, nullable=True, index=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=True)
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
