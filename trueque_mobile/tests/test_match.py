# tests/test_match.py

from backend.utils.match_utils import match_users

def test_match_exact():
    user_a = {"country": "US", "currency": "USD", "amount": 100}
    user_b = {"country": "US", "currency": "USD", "amount": 100}
    assert match_users(user_a, user_b) is True

def test_match_mismatch_currency():
    user_a = {"country": "US", "currency": "USD", "amount": 100}
    user_b = {"country": "US", "currency": "MXN", "amount": 100}
    assert match_users(user_a, user_b) is False

def test_match_partial_within_tolerance():
    user_a = {"country": "US", "currency": "USD", "amount": 100}
    user_b = {"country": "US", "currency": "USD", "amount": 91}
    assert match_users(user_a, user_b) is True  # within ±10%

def test_match_partial_outside_tolerance():
    user_a = {"country": "US", "currency": "USD", "amount": 100}
    user_b = {"country": "US", "currency": "USD", "amount": 89}
    assert match_users(user_a, user_b) is False  # outside ±10%