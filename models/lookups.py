# trueque-web/models/lookups.py
from sqlalchemy import Column, Integer, Text, Numeric, Boolean
from .base import Base

class DeliveryMethod(Base):
    __tablename__ = "delivery_methods"
    code = Column(Text, primary_key=True)
    label = Column(Text, nullable=False)

class AgentConfig(Base):
    __tablename__ = "agent_configs"
    agent_code = Column(Text, primary_key=True)
    country = Column(Text, primary_key=False)
    supported_methods = Column(Text)  # JSON text or comma-separated for simplicity
    base_fee = Column(Numeric(18,6))

class CorridorConfig(Base):
    __tablename__ = "corridor_configs"
    corridor = Column(Text, primary_key=True)
    model = Column(Text)  # OM or MTB
    regulatory_notes = Column(Text)
    enabled = Column(Boolean, default=True)