import unittest
from unittest.mock import MagicMock
from datetime import datetime, timezone
from backend.logic.kyc_orchestrator import KYCOrchestrator
from backend.models.user_model import User
from backend.models.internal_wallet_model import InternalWallet
from backend.common.errors import TruequeError

class TestMerchantFlow(unittest.TestCase):
    def setUp(self):
        self.mock_db = MagicMock()
        self.orchestrator = KYCOrchestrator(self.mock_db)

    def test_merchant_kyc_success(self):
        # Setup
        user = User(id=1, email="oxxo@store.com", user_type="MERCHANT", kyc_status="PENDING")
        self.mock_db.query.return_value.filter.return_value.first.return_value = user
        
        # Execute
        updated_user = self.orchestrator.process_merchant_kyc(1, "TAX-123456", "OXXO Store 1")
        
        # Verify
        self.assertEqual(updated_user.kyc_tier, 2)
        # self.assertEqual(updated_user.kyc_status, "APPROVED") # Once status col is confirmed
        self.assertEqual(updated_user.full_name, "OXXO Store 1")
        
        # Verify Audit Log was added
        self.mock_db.add.assert_called() 
        self.mock_db.commit.assert_called()

    def test_peer_kyc_fail(self):
        # Peer trying to do Merchant KYC should fail
        user = User(id=2, email="peer@test.com", user_type="PEER", kyc_status="PENDING")
        self.mock_db.query.return_value.filter.return_value.first.return_value = user
        
        with self.assertRaises(TruequeError):
            self.orchestrator.process_merchant_kyc(2, "TAX-123", "Fake Business")

    def test_invalid_tax_id(self):
        user = User(id=1, email="oxxo@store.com", user_type="MERCHANT", kyc_status="PENDING")
        self.mock_db.query.return_value.filter.return_value.first.return_value = user
        
        with self.assertRaises(TruequeError): # Length < 5
            self.orchestrator.process_merchant_kyc(1, "123", "Short Tax ID")
            
    def test_wallet_model_integrity(self):
        wallet = InternalWallet(user_id=1, currency="MXN", balance=500.00)
        self.assertEqual(wallet.currency, "MXN")
        # Ensure numeric type handles float initialization (SQLAlchemy handles this usually, 
        # but in unit test objects are just objects)
        self.assertEqual(wallet.balance, 500.00)

if __name__ == '__main__':
    unittest.main()
