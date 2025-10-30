from sqlalchemy import Column, String, Float, Date
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class DailyRate(Base):
    __tablename__ = "daily_rates"

    id = Column(String, primary_key=True)
    base_currency = Column(String, nullable=False)
    target_currency = Column(String, nullable=False)
    rate = Column(Float, nullable=False)
    date = Column(Date, nullable=False)