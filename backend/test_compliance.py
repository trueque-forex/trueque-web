import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock
from sqlalchemy.orm import Session

from backend.models.transaction import Transaction
from backend.models.user_model import User
from backend.models.offer_model import Offer
from backend.services.compliance_reporting import ComplianceReportingService
from backend.models.kyc_audit_model import KYCAuditLog

class TestCompliance(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock(spec=Session)

    def test_csv_generation(self):
        # 1. Mock Data
        mock_user = User(id=1, full_name="John Doe", country="US", kyc_tier=2)
        mock_tx = Transaction(
            id="tx_123",
            user_id=1,
            amount=100.0,
            exchange_rate=1.0, 
            status="confirmed",
            from_currency="USD",
            to_currency="MXN",
            remittance_purpose="FAMILY_SUPPORT",
            timestamp=datetime(2023, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        )
        
        # Mock Query Result
        self.mock_db.query.return_value.join.return_value.outerjoin.return_value.filter.return_value.filter.return_value.all.return_value = [
            (mock_tx, mock_user, None)
        ]
        
        # 2. Generate Report
        service = ComplianceReportingService(self.mock_db)
        csv_output = service.generate_csv_report(
            start_date=datetime(2023, 1, 1, tzinfo=timezone.utc),
            end_date=datetime(2023, 1, 2, tzinfo=timezone.utc)
        )
        
        # 3. Verify Output
        self.assertIn("John Doe", csv_output)
        self.assertIn("FAMILY_SUPPORT", csv_output)
        
    def test_audit_log_fields(self):
        # Verify Model integrity
        audit = KYCAuditLog(
            entity_id=1,
            action="STATUS_CHANGE",
            old_status="PENDING",
            new_status="APPROVED",
            actor="ADMIN"
        )
        self.assertEqual(audit.action, "STATUS_CHANGE")

    def test_offer_model_fields(self):
        offer = Offer(
            user_id="u1",
            amount_offered=100,
            sender_ip="1.2.3.4",
            device_fingerprint="fp_abc"
        )
        self.assertEqual(offer.sender_ip, "1.2.3.4")

    def test_merchant_swap(self):
        # 1. Setup: Peer Sender -> Merchant Receiver
        sender = User(id=200, full_name="Joao Peer", country="ES", user_type="PEER", kyc_tier=1)
        merchant = User(id=900, full_name="OXXO Official", country="MX", user_type="MERCHANT", kyc_tier=2)
        
        tx = Transaction(
            id="tx_internal_ledger_1",
            user_id=sender.id,
            beneficiary_id=merchant.id, # Link to Merchant
            amount=100.0,
            from_currency="EUR",
            to_currency="MXN",
            status="confirmed",
            remittance_purpose="GOODS",
            timestamp=datetime(2025, 7, 1, 12, 0, 0, tzinfo=timezone.utc)
        )
        
        # Mock Query Result
        # The service now joins Transaction -> Sender (User) -> Receiver (User)
        # We need to mock the result tuple: (Transaction, Sender, Receiver)
        # Mock Query Result
        # The service call has NO date filters, so it goes query -> join -> outerjoin -> all
        self.mock_db.query.return_value.join.return_value.outerjoin.return_value.all.return_value = [
            (tx, sender, merchant)
        ]
        
        # 2. Generate Report
        service = ComplianceReportingService(self.mock_db)
        csv_output = service.generate_csv_report()
        
        # 3. Assertions
        # Must contain Merchant's Legal Name as Beneficiary/Receiver
        self.assertIn("OXXO Official", csv_output)
        self.assertIn("Joao Peer", csv_output)
        self.assertIn("GOODS", csv_output) 

if __name__ == '__main__':
    unittest.main()
