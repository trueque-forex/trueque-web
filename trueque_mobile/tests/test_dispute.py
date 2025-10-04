import pytest
from backend.utils.pin_utils import safe_hash

def test_dispute_success():
    # Valid PIN within bcrypt's 72-byte limit
    raw_pin = "securePIN1234567890securePIN1234567890securePIN12"  # ~60 bytes
    hashed_pin = safe_hash(raw_pin)
    assert hashed_pin.startswith("$2b$")  # bcrypt hash prefix

def test_dispute_pin_too_long():
    # PIN exceeding 72 bytes
    raw_pin = "A" * 100  # 100 ASCII characters = 100 bytes
    with pytest.raises(ValueError, match="PIN too long for bcrypt"):
        safe_hash(raw_pin)