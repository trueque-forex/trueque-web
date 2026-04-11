
import unittest
import sys
import os
from unittest.mock import MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.logic.limit_enforcer import LimitEnforcer, TruequeError
from backend.models.user_model import User
from backend.models.transaction import Transaction

class TestKYCLimits(unittest.TestCase):
    def test_tier_0_limit(self):
        # Mock DB Session
        mock_db = MagicMock()
        
        # Scenario: User Tier 0 (Limit 200)
        # 1. Mock User Query
        mock_user = User(id=999, kyc_tier=0)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # 2. Mock Previous Volume = 0
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0.0
        
        # Test A: Send 100 -> OK
        try:
            LimitEnforcer.check_limit("999", 100.0, mock_db)
        except TruequeError:
            self.fail("LimitEnforcer raised TruequeError unexpectedly for valid amount!")
            
        # Test B: Send 201 -> Fail
        with self.assertRaises(TruequeError) as cm:
            LimitEnforcer.check_limit("999", 201.0, mock_db)
        self.assertEqual(cm.exception.code, "KYC_LIMIT_EXCEEDED")
        print(f"\nCaught Expected Error: {cm.exception.message}")

    def test_tier_0_accumulated(self):
        mock_db = MagicMock()
        mock_user = User(id=999, kyc_tier=0)
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user
        
        # Scenario: Existing Volume = 150
        mock_db.query.return_value.filter.return_value.scalar.return_value = 150.0
        
        # Test: Send 51 -> Fail (150+51 = 201 > 200)
        with self.assertRaises(TruequeError):
            LimitEnforcer.check_limit("999", 51.0, mock_db)
            
        # Test: Send 50 -> OK
        LimitEnforcer.check_limit("999", 50.0, mock_db)

if __name__ == '__main__':
    unittest.main()
