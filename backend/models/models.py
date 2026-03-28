from sqlalchemy import (
    Table, Column, Integer, String, JSON, MetaData,
    DateTime, Numeric
)
from datetime import datetime

metadata = MetaData()

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

transactions = Table(
    "transactions",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", String, index=True),
    Column("sender_email", String),
    Column("recipient_name", String),
    Column("relationship", String),
    Column("gateway", String),
    Column("amount", Numeric),
    Column("status", String),
    Column("tx_id", String),
    Column("timestamp", DateTime, default=datetime.utcnow),
    Column("from_currency", String),
    Column("to_currency", String),
    Column("rate", Numeric),
    Column("remittance_purpose", String),
    Column("transaction_type", String),
    Column("sender_ip_address", String),
    Column("kyc_tier_at_execution", Integer),
    Column("receiver_user_id", Integer),
)

users = Table(
    "users",
    metadata,
    Column("id", String, primary_key=True),
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
)