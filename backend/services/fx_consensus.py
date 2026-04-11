from decimal import Decimal
import statistics
import time
from typing import Dict, Any, Tuple, List, Optional
from backend.audit_db import AuditDB

class FXConsensusService:
    """
    Orchestrates fetching FX rates from multiple institutional sources
    and calculating a consensus (median) rate to ensure "Truth Rate".
    """
    
    # Threshold for Variance (1%)
    VARIANCE_THRESHOLD = Decimal("0.01")

    @staticmethod
    def _get_mock_rate(base: str, target: str) -> Decimal:
        # Realistic Mock Data (Jan 2026 Projections/Current)
        key = f"{base}-{target}"
        rates = {
            "USD-MXN": Decimal("20.4500"), "MXN-USD": Decimal("0.0489"),
            "USD-EUR": Decimal("0.9250"), "EUR-USD": Decimal("1.0810"),
            "USD-COP": Decimal("4150.00"), "COP-USD": Decimal("0.00024"),
            "USD-ARS": Decimal("1150.50"), "ARS-USD": Decimal("0.00087"),
            "USD-BRL": Decimal("5.8500"), "BRL-USD": Decimal("0.1709"),
            "EUR-MXN": Decimal("22.1500"), "MXN-EUR": Decimal("0.0451"),
            "EUR-COP": Decimal("4480.00"), "COP-EUR": Decimal("0.00022"),
            "EUR-BRL": Decimal("6.3200"), "BRL-EUR": Decimal("0.1582"),
            # Direct Euro-ARS (Derived or Explicit)
            "EUR-ARS": Decimal("1243.50"), "ARS-EUR": Decimal("0.00080"),
            "USD-VES": Decimal("55.5000"), "VES-USD": Decimal("0.0180"),
            "USD-USD": Decimal("1.0"), "EUR-EUR": Decimal("1.0"),
        }
        return rates.get(key, Decimal("1.0550")) # Fallback

    @staticmethod
    def _fetch_oanda(base: str, target: str) -> Decimal:
        # Rate + Tiny variation
        return FXConsensusService._get_mock_rate(base, target)

    @staticmethod
    def _fetch_chainlink(base: str, target: str) -> Decimal:
        rate = FXConsensusService._get_mock_rate(base, target)
        return rate * Decimal("1.0002") # +0.02%

    @staticmethod
    def _fetch_fixer(base: str, target: str) -> Decimal:
        rate = FXConsensusService._get_mock_rate(base, target)
        return rate * Decimal("0.9998") # -0.02%

    @classmethod
    def get_consensus_rate(cls, base: str, target: str, user_id: str = "SYSTEM") -> Tuple[Decimal, bool]:
        """
        Returns (MedianRate, IsUnstable).
        Logs all sources to AuditDB.
        """
        # 1. Fetch Rates (Parallel in Prod)
        rates = {
            "OANDA": cls._fetch_oanda(base, target),
            "CHAINLINK_NCFX": cls._fetch_chainlink(base, target),
            "FIXER_IO": cls._fetch_fixer(base, target)
        }
        
        values = list(rates.values())
        
        # 2. Calculate Consensus (Median)
        median_rate = statistics.median(values)
        
        # 3. Variance Check
        min_rate = min(values)
        max_rate = max(values)
        variance = (max_rate - min_rate) / min_rate if min_rate > 0 else Decimal("0")
        
        is_unstable = variance > cls.VARIANCE_THRESHOLD
        
        # 4. Audit Log
        stability_label = "UNSTABLE" if is_unstable else "STABLE"
        details = f"Consensus: {median_rate:.6f} | Variance: {variance:.4%} [{stability_label}] | Sources: {rates}"
        
        AuditDB.init_db()
        AuditDB.log_alert(
            user_id=user_id,
            alert_type="FX_CONSENSUS_QUOTE",
            details=details,
            fingerprint=f"{base}-{target}-{time.time()}"
        )
        
        print(f"[FX Engine] Use Median: {median_rate:.6f} ({stability_label})")
        
        # Return breakdown if requested? Structure return value.
        # Changing signature might break callers unpacked as (rate, unstable).
        # We can add a new method `get_consensus_details` or attach to return.
        # Let's add a helper method for the dashboard.
        return median_rate, is_unstable

    @classmethod
    def get_live_breakdown(cls, base: str, target: str) -> Dict[str, Any]:
        """
        Returns full breakdown for Admin Dashboard.
        """
        rates = {
            "OANDA": cls._fetch_oanda(base, target),
            "CHAINLINK_NCFX": cls._fetch_chainlink(base, target),
            "FIXER_IO": cls._fetch_fixer(base, target)
        }
        values = list(rates.values())
        median_rate = statistics.median(values)
        min_rate = min(values)
        max_rate = max(values)
        variance = (max_rate - min_rate) / min_rate if min_rate > 0 else Decimal("0")
        is_unstable = variance > cls.VARIANCE_THRESHOLD
        
        return {
            "consensus_rate": median_rate,
            "variance": variance,
            "is_unstable": is_unstable,
            "sources": rates
        }
