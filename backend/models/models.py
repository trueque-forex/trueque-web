from sqlalchemy import (
    Table, Column, Integer, String, JSON, MetaData,
    DateTime, Numeric, CheckConstraint
)
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from backend.database import Base

metadata = Base.metadata
recipient_profiles = Table(
    "recipient_profiles",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("sender_name", String, nullable=False),
    Column("sender_email", String, nullable=False),
    Column("origin_country", String),
    Column("origin_type", String),
    Column("origin_details", JSON),
    Column("recipient_name", String, nullable=False),
    Column("relationship", String),
    Column("destination_country", String),
    Column("destination_type", String),
    Column("destination_details", JSON),
    Column("created_at", DateTime, default=datetime.utcnow),
)



users = Table(
    "users",
    metadata,
    Column("id", PG_UUID(as_uuid=True), primary_key=True),
    Column("trueque_id", String, unique=True, nullable=False),
    Column("email", String, unique=True, nullable=False),
    Column("password_hash", String),
    Column("first_name", String),
    Column("last_name", String),
    Column("dob", String),
    Column("country_of_residence", String),
    Column("country_destiny", String),
    Column("address", String),
    Column("phone_number", String, unique=True, nullable=True),
    Column("created_at", DateTime, default=datetime.utcnow),
    Column("kyc_tier", Integer, default=0),
    Column("kyc_status", String, default="PENDING"),
    Column("user_type", String, default="PEER"),
    Column("tx_count", Integer, default=0),
    Column("dob_enc", String),
    Column("ssn_enc", String),
    Column("id_number_enc", String),
    Column("symmetri_id", String, unique=True, nullable=True),
    Column("trade_mask_sid", String, unique=True, nullable=True),
    CheckConstraint("symmetri_id LIKE '@%'", name="symmetri_id_at_prefix"),
    CheckConstraint("LENGTH(trade_mask_sid) = 14", name="trade_mask_sid_length"),
)