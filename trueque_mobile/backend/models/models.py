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
    Column("sender_email", String),
    Column("recipient_name", String),
    Column("relationship", String),
    Column("gateway", String),
    Column("amount", Numeric),
    Column("status", String),
    Column("tx_id", String),
    Column("timestamp", DateTime, default=datetime.utcnow),
)