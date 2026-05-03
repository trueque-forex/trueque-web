import os
import logging
import requests
from typing import Tuple

logger = logging.getLogger(__name__)

# Fallback rates used ONLY in test mode or when the live API is unreachable
_FALLBACK_RATES: dict = {
    "USD-MXN": 17.50,
    "MXN-USD": 0.057,
    "EUR-USD": 1.08,
    "USD-EUR": 0.92,
    "EUR-MXN": 18.90,
    "MXN-EUR": 0.053,
    "EUR-ARS": 1050.00,
    "ARS-EUR": 0.000952,
    "USD-COP": 4000.0,
    "COP-USD": 0.00025,
    "USD-BRL": 5.05,
    "BRL-USD": 0.198,
}

_OXR_BASE_URL = "https://openexchangerates.org/api/latest.json"
_cache: dict = {}  # Simple in-process cache: {"USD-MXN": (rate, timestamp)}
_CACHE_TTL_SECONDS = 60


def _is_test_mode() -> bool:
    return os.getenv("APP_ENV", "development") == "test"


def get_market_rate(from_currency: str, to_currency: str) -> Tuple[float, str, bool]:
    """
    Returns (rate, source, is_fallback).

    In production: fetches live rates from OpenExchangeRates (USD base),
    converts via USD as the pivot, and caches for 60 seconds.
    In test mode: returns hardcoded fallback rates immediately.
    On API failure: logs a warning and returns fallback rates (is_fallback=True).
    """
    import time

    pair = f"{from_currency}-{to_currency}"

    # Test mode — always use fallback, skip HTTP
    if _is_test_mode():
        rate = _FALLBACK_RATES.get(pair, 1.0)
        return rate, "Fallback (test mode)", True

    # Cache hit
    if pair in _cache:
        rate, ts = _cache[pair]
        if time.time() - ts < _CACHE_TTL_SECONDS:
            return rate, "OpenExchangeRates (cached)", False

    # Live fetch
    api_key = os.getenv("OPENEXCHANGE_API_KEY", "")
    if not api_key or api_key.startswith("test_"):
        rate = _FALLBACK_RATES.get(pair, 1.0)
        logger.warning(f"[FX] No valid API key — using fallback for {pair}: {rate}")
        return rate, "Fallback (no API key)", True

    try:
        resp = requests.get(
            _OXR_BASE_URL,
            params={"app_id": api_key, "symbols": f"{from_currency},{to_currency}"},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()
        rates_usd = data.get("rates", {})

        # OXR returns rates relative to USD. Convert via USD pivot.
        rate_from_usd = rates_usd.get(from_currency, None)
        rate_to_usd = rates_usd.get(to_currency, None)

        if not rate_from_usd or not rate_to_usd:
            raise ValueError(f"Missing rate for {from_currency} or {to_currency}")

        # from_currency → USD → to_currency
        rate = rate_to_usd / rate_from_usd
        _cache[pair] = (rate, time.time())
        return rate, "OpenExchangeRates", False

    except Exception as exc:
        logger.warning(f"[FX] Live rate fetch failed for {pair}: {exc}. Using fallback.")
        rate = _FALLBACK_RATES.get(pair, 1.0)
        return rate, "Fallback (API error)", True