
import unittest
import sys
import os
from unittest.mock import MagicMock
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.schemas.offer_schema import OfferCreate
from backend.logic.risk_engine import RiskEngine

class TestRemitterShield(unittest.TestCase):
    
    def test_purpose_validation(self):
        # 1. Valid
        try:
            OfferCreate(
                user_id="u1", uuid="u1", country="US", currency_from="USD", currency_to="MXN",
                amount_from=100, amount_to=2000, amount=100, remittance_purpose="FAMILY_SUPPORT"
            )
        except Exception as e:
            self.fail(f"Valid purpose raised exception: {e}")

        # 2. Invalid
        with self.assertRaises(ValueError):
             OfferCreate(
                user_id="u1", uuid="u1", country="US", currency_from="USD", currency_to="MXN",
                amount_from=100, amount_to=2000, amount=100, remittance_purpose="LAUNDERING"
            )

    def test_weekly_shield(self):
        mock_db = MagicMock()
        
        # Mock 5 previous transactions
        mock_db.query.return_value.filter.return_value.scalar.return_value = 5
        
        decision = RiskEngine.check_weekly_shield("u1", 100.0, mock_db)
        self.assertEqual(decision.action, 'review')
        self.assertIn("Weekly Velocity", decision.reason)
        
    def test_ip_check(self):
        # 1. Match
        d1 = RiskEngine.check_ip_risk("US", "10.0.0.1")
        self.assertEqual(d1.action, 'approve')
        
        # 2. Mismatch
        d2 = RiskEngine.check_ip_risk("MX", "10.0.0.1") # 10.x mapped to US in mock
        self.assertEqual(d2.action, 'review')
        self.assertIn("GeoIP Mismatch", d2.reason)

if __name__ == '__main__':
    unittest.main()
