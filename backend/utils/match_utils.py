import sqlite3
from datetime import datetime
from backend.utils.fallback_utils import get_last_valid_rate

def get_market_rate(base: str, target: str) -> tuple[float, str, bool]:
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    conn = sqlite3.connect("trueque.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rate FROM rate_cache
        WHERE timestamp = ? AND base = ? AND target = ?
    """, (timestamp, base, target))
    result = cursor.fetchone()
    conn.close()

    if result:
        rate = result[0]
        return rate, f"ExchangeRate.host snapshot at {timestamp}", False
    else:
        fallback_rate, fallback_date = get_last_valid_rate(base, target)
        return fallback_rate, f"ExchangeRate.host snapshot from {fallback_date}", True

def match_users(user_a: dict, user_b: dict) -> bool:
    """
    Determines if two users are a match based on:
    - Same country
    - Same currency
    - Amount within ±10% tolerance
    """
    if user_a["country"] != user_b["country"]:
        return False
    if user_a["currency"] != user_b["currency"]:
        return False

    amount_a = user_a["amount"]
    amount_b = user_b["amount"]
    tolerance = 0.1 * amount_a

    return abs(amount_a - amount_b) <= tolerance