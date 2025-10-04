# tests/conftest.py

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.daily_rate import Base, DailyRate
from datetime import date

@pytest.fixture(scope="session")
def engine():
    return create_engine("sqlite:///:memory:")

@pytest.fixture(scope="session")
def tables(engine):
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)

@pytest.fixture
def session(engine, tables):
    Session = sessionmaker(bind=engine)
    session = Session()
    seed_daily_rates(session)
    yield session
    session.close()

def seed_daily_rates(session):
    session.add_all([
        DailyRate(
            id="usd_mxn_20250929",
            base_currency="USD",
            target_currency="MXN",
            rate=17.45,
            date=date(2025, 9, 29)
        ),
        DailyRate(
            id="usd_mxn_20250928",
            base_currency="USD",
            target_currency="MXN",
            rate=17.42,
            date=date(2025, 9, 28)
        )
    ])
    session.commit()