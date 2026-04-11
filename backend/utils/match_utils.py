from typing import Tuple

def get_market_rate(from_currency: str, to_currency: str) -> Tuple[float, str, bool]:
    """
    Returns (rate, source, is_fallback)
    Mock implementation for now.
    """
    # Mock rates
    rates = {
        "USD-MXN": 17.50,
        "MXN-USD": 0.057,
        "EUR-USD": 1.08,
        "USD-EUR": 0.92,
        "COP-USD": 0.00025,
        "USD-COP": 4000.0
    }
    
    key = f"{from_currency}-{to_currency}"
    rate = rates.get(key, 1.0)
    
    return rate, "Market Mock", False