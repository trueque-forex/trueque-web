# backend/models/advance_model.py
#
# ORM model for the `advances` table.
# The `AdvanceRequest` Pydantic schema has been moved to
# backend/schemas/advance_schema.py — do not define it here.
from sqlalchemy import Column, String, DateTime, Numeric
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime, timezone
import uuid

from backend.database import Base


class Advance(Base):
    __tablename__ = "advances"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # GEMINI.md §2.2 — owner FK is always owner_id, never user_id
    owner_id = Column(PG_UUID(as_uuid=True), nullable=False, index=True)

    uuid = Column(PG_UUID(as_uuid=True), unique=True, nullable=False)
    country = Column(String, nullable=False)
    currency_from = Column(String, nullable=False)
    currency_to = Column(String, nullable=False)

    # GEMINI.md §6.1 — all money as DECIMAL(18,4)
    amount_from = Column(Numeric(18, 4), nullable=False)
    amount_to = Column(Numeric(18, 4), nullable=False)
    amount = Column(Numeric(18, 4), nullable=False)
    market_rate = Column(Numeric(18, 8), nullable=False)

    # Gateway that fulfilled this advance (reference to institutional_gateways.id)
    gateway_id = Column(PG_UUID(as_uuid=True), nullable=True)

    # Status: PENDING | GATEWAY_CONFIRMED | FAILED
    status = Column(String, default="PENDING", nullable=False)

    # Timestamps (GEMINI.md §6.1)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
