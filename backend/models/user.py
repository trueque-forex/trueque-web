# backend/models/user.py
#
# Authoritative ORM model for the `users` table.
# Variable naming strictly follows GEMINI.md §2.1 and §2.2.
# NEVER add user_id as a column — owner_id is the correct FK in child tables.
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        # GEMINI.md §2.1 — symmetri_id must start with '@'
        CheckConstraint("symmetri_id LIKE '@%'", name="symmetri_id_at_prefix"),
        # GEMINI.md §3.2 — trade_mask_sid is exactly 16 chars
        CheckConstraint("trade_mask_sid IS NULL OR LENGTH(trade_mask_sid) = 16", name="trade_mask_sid_length"),
        {'extend_existing': True},
    )

    # Primary key
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # GEMINI.md §2.1 — the @handle, unique across the platform
    symmetri_id = Column(String, unique=True, nullable=False, index=True)

    # GEMINI.md §3.2 — Trade Room SID, issued at KYC submission (PENDING state)
    trade_mask_sid = Column(String(16), unique=True, nullable=True, index=True)

    # Auth & identity
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    dob = Column(String, nullable=True)

    # Geography
    country_of_residence = Column(String(2), nullable=True)
    country_destiny = Column(String(2), nullable=True)
    address = Column(String, nullable=True)
    phone_number = Column(String, unique=True, nullable=True)

    # KYC — GEMINI.md §2.1 kyc_status enum: EMPTY | PENDING | APPROVED
    kyc_tier = Column(Integer, default=0)
    kyc_status = Column(
        String,
        default="EMPTY",
        nullable=False
    )

    # Account type: PEER | MERCHANT | ADMIN
    user_type = Column(String, default="PEER", nullable=False)
    tx_count = Column(Integer, default=0)

    # Encrypted PII fields (GEMINI.md §4.1)
    dob_enc = Column(String, nullable=True)
    ssn_enc = Column(String, nullable=True)
    id_number_enc = Column(String, nullable=True)

    # Transaction PIN hash — bcrypt via pin_utils.safe_hash()
    # Used by advance, dispute, and pin routes for action authorization.
    # NOT the login password — separate credential for in-app actions.
    pin_hash = Column(String, nullable=True)

    # Timestamps (GEMINI.md §6.1)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    kyc = relationship("UserKYC", uselist=False, back_populates="user", overlaps="user,kyc")