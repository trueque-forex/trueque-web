import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base, get_db
from backend.routes.trades import router as trades_router
from backend.models.transaction import Transaction
from backend.models.offer_model import Offer
import uuid

# Create isolated App for testing
app = FastAPI()
app.include_router(trades_router)

# Setup isolated test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_trades_isolated.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ONLY create tables for the models involved in this test suite
# This avoids NoReferencedTableError from other unrelated models
Transaction.__table__.create(bind=engine, checkfirst=True)
Offer.__table__.create(bind=engine, checkfirst=True)

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

def test_details_offer(db_session):
    offer_id = str(uuid.uuid4())
    db_session.add(Offer(uuid=offer_id, owner_id="user1", amount_offered=100, currency_from="EUR", currency_to="ARS", amount_from=100, amount_to=100, market_rate=1.0, country="ES"))
    db_session.commit()
    
    response = client.get(f"/api/trades/details/{offer_id}")
    assert response.status_code == 200
    assert response.json()["id"] == offer_id

def test_signal_funding(db_session):
    offer_id = str(uuid.uuid4())
    db_session.add(Offer(uuid=offer_id, owner_id="user1", amount_offered=100, currency_from="EUR", currency_to="ARS", amount_from=100, amount_to=100, market_rate=1.0, country="ES"))
    db_session.commit()
    
    response = client.post("/api/trades/signal-funding", json={"trade_id": offer_id})
    assert response.status_code == 200
    assert response.json()["status"] == "FUNDING_SIGNALED"
