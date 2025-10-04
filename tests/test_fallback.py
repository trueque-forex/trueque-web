# tests/test_fallback.py

from backend.utils.fallback_utils import get_last_valid_rate

def test_get_last_valid_rate(session):
    rate, rate_date = get_last_valid_rate("USD", "MXN", session)
    assert rate == 17.45
    assert rate_date == "2025-09-29"