import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import app
from backend.database import Base, get_db

# Import ALL model files to ensure Base.metadata is fully populated
from backend.models import models, transaction, offer_model, gateway, user_kyc
# Note: models.py uses the 'metadata' object directly, others use 'Base'

import uuid

# Setup isolated test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_esco_final.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Standardize Base for testing - this will only create tables linked to 'Base'
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
    # Clean tables involved in the test
    db.query(gateway.InstitutionalGateway).delete()
    db.query(offer_model.Offer).delete()
    db.query(transaction.Transaction).delete()
    db.commit()
    yield db
    db.close()

def test_esco_orchestration_instructions(db_session):
    # 1. Seed Bizum Gateway
    gw = gateway.InstitutionalGateway(
        id=uuid.uuid4(),
        corridor_code="ES-CO",
        rail_type="BIZUM",
        currency="EUR",
        payment_details={"phone": "+34 600 000 000", "merchant_name": "Symmetri Test"},
        instruction_template="Send to {{phone}} ref {{reference}}"
    )
    db_session.add(gw)
    db_session.commit()

    # 2. Create Offer
    offer_id = str(uuid.uuid4())
    offer = offer_model.Offer(
        uuid=offer_id,
        owner_id="user123",
        amount_offered=50.0,
        currency_from="EUR",
        currency_to="COP",
        amount_from=50.0,
        amount_to=50.0,
        market_rate=1.0,
        country="ES"
    )
    db_session.add(offer)
    db_session.commit()

    # 3. Request Details
    response = client.get(f"/api/trades/details/{offer_id}")
    assert response.status_code == 200
    data = response.json()
    
    # Verify dynamic instruction hydration
    short_ref = offer_id[:8].upper()
    expected_instr = f"Send to +34 600 000 000 ref {short_ref}"
    assert data["instructions"] == expected_instr
    assert data["bank_name"] == "BIZUM"

def test_gateway_not_found_fallback(db_session):
    offer_id = str(uuid.uuid4())
    offer = offer_model.Offer(
        uuid=offer_id,
        owner_id="user123",
        amount_offered=50.0,
        currency_from="USD", 
        currency_to="COP",
        amount_from=50.0,
        amount_to=50.0,
        market_rate=1.0,
        country="US"
    )
    db_session.add(offer)
    db_session.commit()

    response = client.get(f"/api/trades/details/{offer_id}")
    assert response.status_code == 200
    assert response.json()["instructions"] == "Please coordinate with Symmetri Support."
