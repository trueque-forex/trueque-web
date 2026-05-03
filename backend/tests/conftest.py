"""
conftest.py — Pytest fixtures for isolated, in-memory test environment.

Every test gets a fresh SQLite database. No Supabase, no real money, no side effects.
To run: APP_ENV=test pytest backend/tests/ -v
"""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load test environment variables before anything else
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env.test'), override=True)

from backend.database import Base

# --- All models must be imported here so Base.metadata knows about their tables ---
from backend.models.user import User
from backend.models.transaction import Transaction
from backend.models.match_model import Match
from backend.models.offer_model import Offer


TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db():
    """
    Provides a clean, isolated SQLite in-memory DB session for each test.
    Tables are created fresh and torn down after each test function.
    """
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def match_service():
    """Provides a fresh MatchService instance per test."""
    from backend.services.match_service import MatchService
    return MatchService()


@pytest.fixture(scope="function")
def kms():
    """Provides a KMSService instance using test encryption key."""
    from backend.services.kms_service import KMSService
    return KMSService()
