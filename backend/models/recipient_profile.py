# backend/models/recipient_profile.py
from sqlalchemy import Column, Integer, String, JSON, DateTime, CheckConstraint, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime, timezone
from backend.database import Base


class RecipientProfile(Base):
    """
    Phase 1: Stores sender + recipient pairing information for voucher issuance.
    owner_id references users.id (§2.1 — NEVER user_id).
    All child tables must follow this FK pattern per GEMINI.md §6.1.
    """
    __tablename__ = "recipient_profiles"
    __table_args__ = (
        CheckConstraint(
            "destination_type IN ('bank', 'mobile_wallet', 'cash_pickup', 'voucher')",
            name="recipient_profiles_destination_type_check"
        ),
        {'extend_existing': True},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)

    # Owner FK — always owner_id, never user_id (GEMINI.md §2.2)
    owner_id = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,   # nullable for legacy rows created before auth was wired
        index=True
    )

    # Sender info (denormalised for quick read at voucher issuance time)
    sender_name = Column(String, nullable=False)
    sender_email = Column(String, nullable=False)
    origin_country = Column(String(2))
    origin_type = Column(String(30))
    origin_details = Column(JSON)

    # Recipient / beneficiary info
    recipient_name = Column(String, nullable=False)
    relationship = Column(String(50))
    destination_country = Column(String(2))
    destination_type = Column(String(30))
    destination_details = Column(JSON)

    # Timestamps (GEMINI.md §6.1 — all tables must include both)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
