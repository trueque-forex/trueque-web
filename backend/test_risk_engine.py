
import unittest
import sys
import os
from unittest.mock import MagicMock
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.logic.risk_engine import RiskEngine
from backend.models.offer_model import Offer

class TestRiskEngine(unittest.TestCase):
    def test_velocity_check(self):
        mock_db = MagicMock()
        
        # Scenario 1: Low Volume (0 previous) -> APPROVE
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0
        decision = RiskEngine.check_velocity("user_123", 100.0, mock_db)
        self.assertEqual(decision.action, 'approve')
        
        # Scenario 2: High Volume (3 previous) -> REVIEW
        mock_db.query.return_value.filter.return_value.scalar.return_value = 3
        decision = RiskEngine.check_velocity("user_123", 100.0, mock_db)
        self.assertEqual(decision.action, 'review')
        self.assertIn("Velocity Exceeded", decision.reason)
        
        # Scenario 3: High Value (> 1000) -> REVIEW
        mock_db.query.return_value.filter.return_value.scalar.return_value = 0
        decision = RiskEngine.check_velocity("user_123", 1500.0, mock_db)
        self.assertEqual(decision.action, 'review')
        self.assertIn("High Value", decision.reason)

if __name__ == '__main__':
    unittest.main()
