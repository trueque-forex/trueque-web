import unittest
import sys
import os

# Add root to sys.path to allow imports from backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime, timezone
from unittest.mock import MagicMock
from sqlalchemy.orm import Session

from backend.models.transaction import Transaction
from backend.models.user_model import User
from backend.services.compliance_reporting import ComplianceReportingService

class TestFinCENReporting(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock(spec=Session)

    def test_eur_to_ngn_report(self):
        # 1. Setup Data: Spanish Sender sending to Nigeria
        mock_user = User(id=101, full_name="Maria Garcia", country="ES", kyc_tier=1)
        mock_tx = Transaction(
            tx_id="tx_eur_ngn_1",
            user_id=101,
            amount=500.00, # EUR
            status="confirmed",
            from_currency="EUR",
            to_currency="NGN",
            remittance_purpose="FAMILY_SUPPORT",
            sender_ip_address="192.168.1.50",
            kyc_tier_at_execution=1,
            timestamp=datetime(2025, 6, 15, 10, 30, 0, tzinfo=timezone.utc)
        )
        
        # Mock Query Result
        self.mock_db.query.return_value.join.return_value.outerjoin.return_value.filter.return_value.filter.return_value.all.return_value = [
            (mock_tx, mock_user, None) # None for Receiver in this test case
        ]
        
        # 2. Execute Report
        service = ComplianceReportingService(self.mock_db)
        csv_output = service.generate_csv_report(
            start_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
            end_date=datetime(2025, 12, 31, tzinfo=timezone.utc)
        )
        
        with open("debug_output.txt", "w") as f:
            f.write(csv_output)
            
        print("Debug output written to debug_output.txt")

        # 3. Verify Constraints
        self.assertIn("Maria Garcia", csv_output)
        self.assertIn("ES", csv_output) 
        self.assertIn("540.00", csv_output) # 500 EUR * 1.08 = 540.00 USD
        self.assertIn("FAMILY_SUPPORT", csv_output)

if __name__ == '__main__':
    unittest.main()
