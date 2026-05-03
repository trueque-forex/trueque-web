import sys
import os
import uuid
import pytest
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend to sys.path
sys.path.append(os.getcwd())

from backend.database import Base
from backend.models.user import User
from backend.models.transaction import Transaction
from backend.controllers.transaction_controller import TransactionController
from backend.utils.checksum import iso7064_mod97_10, validate_sid

# --- Global Variable Dictionary Constants ---
MIN_ORDER_VALUE = Decimal('20.00')

@pytest.fixture
def db():
    """Provides an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    # Ensure all models are registered with the Base
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_symmetri_id_at_prefix_enforcement(db):
    """Requirement: symmetri_id must start with @."""
    # Valid handle
    user = User(
        id=uuid.uuid4(), 
        symmetri_id="@lead_engineer", 
        trade_mask_sid="MX260407104258",
        email="lead@example.com"
    )
    db.add(user)
    db.commit()
    assert user.symmetri_id == "@lead_engineer"

    # Invalid handle (missing @)
    with pytest.raises(ValueError, match="Symmetri ID"):
        User(
            id=uuid.uuid4(), 
            symmetri_id="lead_engineer", 
            email="bad@example.com"
        )


def test_min_order_value_guard(db):
    """Requirement: Hard-reject any transaction where principal < MIN_ORDER_VALUE ($20)."""
    controller = TransactionController()
    owner_id = uuid.uuid4()
    
    # Testing exactly $19.99 (Below MIN_ORDER_VALUE)
    below_floor = MIN_ORDER_VALUE - Decimal('0.01')
    with pytest.raises(Exception) as excinfo:
        controller.create_retail_voucher(db, owner_id, below_floor, "USD", "MX", "MXN", "payment_token")
    assert "Minimum Order Value" in str(excinfo.value)


def test_sync_lock_requirement(db):
    """Requirement: The Synchronous Lock (payment_success_token must be present)."""
    controller = TransactionController()
    owner_id = uuid.uuid4()
    
    # Attempting creation without payment_success_token
    with pytest.raises(Exception) as excinfo:
        controller.create_retail_voucher(
            db, owner_id, MIN_ORDER_VALUE, "USD", "MX", "MXN", payment_success_token=None
        )
    # Check for the correct error code/message context
    assert "Synchronous Lock active" in str(excinfo.value)


def test_retailer_wholesale_margin_calculation(db):
    """Requirement: retailer_wholesale_margin must store absolute Decimal value of 15% profit."""
    controller = TransactionController()
    owner_id = uuid.uuid4()
    principal = Decimal('100.00')
    
    res = controller.create_retail_voucher(
        db, owner_id, principal, "USD", "MX", "MXN", payment_success_token="tok_valid_123"
    )
    
    assert res["success"] is True
    # 15% of 100.00 is 15.00
    assert Decimal(str(res["margin_captured"])) == Decimal('15.00')


def test_sid_checksum_validation():
    """
    Requirement: 14-char SID (ISO/IEC 7064 Modulo 97-10).
    Explicit Test: MX2604071042 results in checksum 58.
    Date: April 7, 2026.
    """
    base_data = "MX2604071042"
    expected_checksum = "58"
    
    generated_cs = iso7064_mod97_10(base_data)
    assert generated_cs == expected_checksum
    
    full_sid = f"{base_data}{generated_cs}"
    assert len(full_sid) == 14
    assert validate_sid(full_sid) is True


if __name__ == "__main__":
    # Fallback for manual execution without pytest
    print("Running Symmetri Manual Verification...")
    pass
