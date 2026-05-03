import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db
from backend.models.transaction import Transaction, Beneficiary
from backend.models.offer_model import Offer
from backend.models.user_model import User
import uuid
from datetime import datetime, timezone

# Setup test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_trades.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    yield db
    db.close()

def test_get_trade_details_offer(db_session):
    # 1. Create a mock offer
    offer_uuid = str(uuid.uuid4())
    new_offer = Offer(
        uuid=offer_uuid,
        owner_id="test-user-id",
        amount_offered="100.00",
        currency_from="EUR",
        currency_to="ARS",
        status="PENDING"
    )
    db_session.add(new_offer)
    db_session.commit()

    # 2. Test fetching details
    response = client.get(f"/api/trades/details/{offer_uuid}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == offer_uuid
    assert data["type"] == "SYNTHETIC"
    assert data["status"] == "PENDING"

def test_signal_funding_offer(db_session):
    # 1. Create a mock offer
    offer_uuid = str(uuid.uuid4())
    new_offer = Offer(
        uuid=offer_uuid,
        owner_id="test-user-id",
        amount_offered="100.00",
        currency_from="EUR",
        currency_to="ARS",
        status="PENDING"
    )
    db_session.add(new_offer)
    db_session.commit()

    # 2. Signal funding
    response = client.post("/api/trades/signal-funding", json={"trade_id": offer_uuid})
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["status"] == "FUNDING_SIGNALED"

    # 3. Verify in DB
    db_session.refresh(new_offer)
    assert new_offer.status == "FUNDING_SIGNALED"

def test_get_trade_details_not_found():
    response = client.get(f"/api/trades/details/{uuid.uuid4()}")
    assert response.status_code == 404
