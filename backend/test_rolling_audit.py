
import unittest
import sys
import os
import sqlite3
import json
from unittest.mock import MagicMock
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.logic.risk_engine import RiskEngine
from backend.logic.fee_calculator import FeeCalculator
from backend.services.audit_assistant import AuditAssistant
from backend.audit_db import AuditDB

# Create a mock Offer class with 'amount' as a property or attribute
class MockOffer:
    def __init__(self, amount, remittance_purpose="FAMILY_SUPPORT"):
        self.amount = amount
        self.remittance_purpose = remittance_purpose

class TestRollingAudit(unittest.TestCase):
    
    def setUp(self):
        # Init Audit DB
        AuditDB.init_db()
        pass

    def test_fee_calculator_volume(self):
        # Scenario: User has 400 volume. Sends 200. Total 600 -> > 500.
        # Should apply 1.2% fee.
        
        mock_db = MagicMock()
        # Mock func.sum return value = 400
        mock_db.query.return_value.filter.return_value.scalar.return_value = 400.0
        
        res = FeeCalculator.calculate_friction(
            "US", "AR", 200.0, "debit_card", "visa_direct", db=mock_db, user_id="u1"
        )
        
        # Trueque Fee: 200 * 0.012 = 2.40
        # Check 'trueque_fee' in breakdown
        self.assertEqual(res['breakdown']['trueque_fee'], 2.40)
        
    def test_fee_calculator_low_volume(self):
        # Scenario: User has 100 volume. Sends 100. Total 200 -> < 500.
        # Should apply fixed fee (e.g. 1.50 from config or whatever is default)
        
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.scalar.return_value = 100.0
        
        res = FeeCalculator.calculate_friction(
            "US", "AR", 100.0, "debit_card", "visa_direct", db=mock_db, user_id="u1"
        )
        
        # Default fee is 1.50 in config usually. It definitely shouldn't be 1.2% (1.20)
        self.assertNotEqual(res['breakdown']['trueque_fee'], 1.20) 
        self.assertEqual(res['breakdown']['trueque_fee'], 1.50) # Assuming 1.50 fixed

    def test_velocity_audit_trigger(self):
        mock_db = MagicMock()
        # Mock count = 1 (1 previous tx)
        mock_db.query.return_value.filter.return_value.scalar.return_value = 1
        
        decision = RiskEngine.check_velocity("u1", 100.0, mock_db)
        
        self.assertEqual(decision.action, 'review')
        self.assertEqual(decision.status, 'STATUS_AUDIT_PENDING')
        
    def test_audit_assistant(self):
        mock_db = MagicMock()
        # Mock list of objects
        mock_db.query.return_value.filter.return_value.all.return_value = [
            MockOffer(100.0), MockOffer(200.0)
        ]
        
        summary = AuditAssistant.generate_good_faith_summary("u1", mock_db)
        self.assertIn("2 swaps", summary)
        self.assertIn("total $300.00", summary)
        self.assertIn("Approve", summary)

    def test_audit_db_log(self):
        # Write log
        AuditDB.log_alert("test_u1", "TEST_ALERT", "Details", "fp_123")
        
        # Read back
        conn = AuditDB.get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM audit_alerts WHERE user_id='test_u1' ORDER BY id DESC LIMIT 1")
        row = c.fetchone()
        conn.close()
        
        self.assertIsNotNone(row)
        self.assertEqual(row[1], "test_u1")
        self.assertEqual(row[2], "TEST_ALERT")

if __name__ == '__main__':
    unittest.main()
