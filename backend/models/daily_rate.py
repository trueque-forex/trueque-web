from backend.database import Base
from sqlalchemy import Column, String, Float, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

class DailyRate(Base):
    __tablename__ = "daily_rates"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    base_currency = Column(String, nullable=False)
    target_currency = Column(String, nullable=False)
    rate = Column(Numeric(18, 6), nullable=False)
    date = Column(Date, nullable=False)