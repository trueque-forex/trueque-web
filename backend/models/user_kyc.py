# backend/models/user_kyc.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from backend.database import Base

class UserKYC(Base):
    __tablename__ = 'user_kyc'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), unique=True, nullable=False)
    trueque_id = Column(String(20), nullable=False, index=True)
    
    # KYC Status
    kyc_status = Column(String(20), default='not_required')  # 'not_required', 'required', 'pending', 'approved', 'rejected'
    kyc_level = Column(Integer, default=0)  # 0 = none, 1 = basic, 2 = enhanced
    
    # Transaction Tracking (for triggering KYC)
    transaction_count = Column(Integer, default=0)
    total_transaction_value_usd = Column(Numeric(15, 2), default=0)
    last_transaction_date = Column(DateTime)
    
    # Personal Information
    full_legal_name = Column(String(200))
    date_of_birth = Column(String(10))
    nationality = Column(String(2))
    occupation = Column(String(100))
    
    # Address
    street = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(2))
    
    # Document Information
    document_type = Column(String(30))  # 'passport', 'drivers_license', 'national_id'
    document_number = Column(String(100))
    document_issue_date = Column(String(10))
    document_expiry_date = Column(String(10))
    document_issuing_country = Column(String(2))
    
    # Document URLs (encrypted storage paths)
    document_front_url = Column(String(500))
    document_back_url = Column(String(500))
    selfie_url = Column(String(500))
    proof_of_address_url = Column(String(500))
    
    # Additional Information
    source_of_funds = Column(String(50))
    purpose_of_transaction = Column(Text)
    estimated_monthly_volume = Column(String(20))
    
    # Consent
    agreed_to_data_processing = Column(Boolean, default=False)
    agreed_to_screening = Column(Boolean, default=False)
    
    # Timestamps
    kyc_submitted_at = Column(DateTime)
    kyc_reviewed_at = Column(DateTime)
    kyc_approved_at = Column(DateTime)
    kyc_rejected_at = Column(DateTime)
    rejection_reason = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="kyc")


class KYC_Transaction(Base):
    __tablename__ = 'kyc_transactions' # Renaming table to avoid conflict if created
    
    id = Column(Integer, primary_key=True)
    transaction_id = Column(String(20), unique=True, nullable=False, index=True)  # Trueque ID format
    
    # User IDs
    user_a_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    user_b_id = Column(PG_UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Transaction Details
    user_a_sends_amount = Column(Numeric(15, 2), nullable=False)
    user_a_sends_currency = Column(String(3), nullable=False)
    user_b_sends_amount = Column(Numeric(15, 2), nullable=False)
    user_b_sends_currency = Column(String(3), nullable=False)
    
    # Exchange Rate
    market_rate = Column(Numeric(10, 6), nullable=False)
    effective_rate = Column(Numeric(10, 6), nullable=False)
    
    # Fees
    total_fees_user_a = Column(Numeric(15, 2), default=0)
    total_fees_user_b = Column(Numeric(15, 2), default=0)
    gateway_fee_user_a = Column(Numeric(15, 2), default=0)
    gateway_fee_user_b = Column(Numeric(15, 2), default=0)
    payment_method_fee_user_a = Column(Numeric(15, 2), default=0)
    payment_method_fee_user_b = Column(Numeric(15, 2), default=0)
    trueque_fee_user_a = Column(Numeric(15, 2), default=0)
    trueque_fee_user_b = Column(Numeric(15, 2), default=0)
    
    # Status
    status = Column(String(20), default='pending')  # 'pending', 'kyc_required', 'processing', 'completed', 'cancelled', 'failed'
    
    # Payment Methods
    user_a_payment_method_id = Column(String(50))
    user_b_payment_method_id = Column(String(50))
    
    # KYC Check
    kyc_checked = Column(Boolean, default=False)
    kyc_required = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    user_a = relationship("User", foreign_keys=[user_a_id])
    user_b = relationship("User", foreign_keys=[user_b_id])
