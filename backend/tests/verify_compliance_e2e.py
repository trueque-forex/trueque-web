
import os
import sys
import unittest
import uuid
import decimal
from decimal import Decimal
from datetime import datetime

# Add path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.fee_orchestrator import FeeOrchestrator
from backend.controllers.payment_controller import PaymentController
from backend.controllers.draft_controller import DraftController
from backend.models.transaction import Transaction
from backend.models.draft_model import Draft
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Mock DB for Testing
from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

class TestComplianceE2E(unittest.TestCase):
    def setUp(self):
        # 0. Setup In-Memory DB for verifying Models
        self.engine = create_engine('sqlite:///:memory:')
        # Re-create tables based on imported models
        # Need to import Generic Base from models or just assume we test the Classes
        # Let's rely on Controllers logic mainly, and check types.
        
        self.orchestrator = FeeOrchestrator()
        self.controller = PaymentController()
        self.draft_controller = DraftController()
        
        # Session Mock
        Session = sessionmaker(bind=self.engine)
        self.db = Session()

        # Create Tables (Manual for this test scope to ensure schema matches)
        # We need to import the actual Base from models
        from backend.models.transaction import Base as TxBase
        from backend.models.draft_model import Base as DraftBase
        TxBase.metadata.create_all(self.engine)
        DraftBase.metadata.create_all(self.engine)

    def tearDown(self):
        self.db.close()

    def test_decimal_precision_in_models(self):
        print("\n=== TEST: Decimal Precision in Models ===")
        # Create a transaction with high precision decimal
        # 100.12345678, Rate 1.12345678
        t1 = Transaction(
            tx_id=str(uuid.uuid4()),
            user_id="user_test_1",
            from_currency="USD",
            to_currency="EUR",
            amount=Decimal("100.1234"),    # Scale 4
            rate=Decimal("1.12345678"),    # Scale 8
            status="pending"
        )
        self.db.add(t1)
        self.db.commit()
        
        # Retrieve
        saved = self.db.query(Transaction).filter_by(user_id="user_test_1").first()
        
        print(f"Saved Amount Type: {type(saved.amount)} Value: {saved.amount}")
        print(f"Saved Rate Type: {type(saved.rate)} Value: {saved.rate}")
        
        self.assertIsInstance(saved.amount, Decimal, "Amount MUST be Decimal")
        self.assertIsInstance(saved.rate, Decimal, "Rate MUST be Decimal")
        self.assertEqual(saved.amount, Decimal("100.1234"))
        self.assertEqual(saved.rate, Decimal("1.12345678"))
        print("✅ Models STRICTLY use Decimal.")

    def test_fee_orchestrator_decimals(self):
        print("\n=== TEST: Fee Orchestrator Decimal Logic ===")
        # Input floats, expect precise internal math
        # We'll use a specific amount that causes float drifts generally
        # e.g. 0.1 + 0.2
        
        # But we are calling the API which expects Decimals now in the modified version?
        # The controller.get_authorization_quote signature was updated to accept Decimals.
        # Let's pass Decimals.
        
        amount = Decimal("100.00")
        rate = Decimal("1.00")
        
        quote = self.controller.get_authorization_quote(
            amount_send=amount,
            currency_from='USD',
            currency_to='USD',
            mid_market_rate=rate,
            payment_method='bank_transfer',
            outbound_method='bank_rtp'
        )
        
        # Verify Breakdown values are floats (for JSON) but derived correctly
        bd = quote['breakdown']
        print(f"Quote Breakdown: {bd}")
        
        # Check type of breakdown values
        self.assertIsInstance(bd['inbound_fee'], float, "JSON response must be float")
        
        # Check Total Cost Pct
        # If RTP, cost is 0?
        # US->US RTP usually minimal.
        
        print("✅ Fee Orchestrator returned valid quote structure.")

    def test_draft_lifecycle(self):
        print("\n=== TEST: Draft Lifecycle (Intent Tracking) ===")
        user_id = "test_user_draft_1"
        
        # 1. Create Draft
        draft = self.draft_controller.create_draft(user_id, {"amount": 100, "currency": "USD"}, self.db)
        print(f"Created Draft: {draft.id} - Step: {draft.step}")
        self.assertEqual(draft.status, "active")
        
        # 2. Get Active
        found = self.draft_controller.get_active_draft(user_id, self.db)
        self.assertEqual(found.id, draft.id)
        
        # 3. Update Draft
        updated = self.draft_controller.update_draft(draft.id, user_id, {"recipient": "Maria"}, "beneficiary", self.db)
        print(f"Updated Draft: {updated.data} - Step: {updated.step}")
        self.assertEqual(updated.data['recipient'], 'Maria')
        self.assertEqual(updated.step, 'beneficiary')
        
        print("✅ Draft Controller Lifecycle verified.")

if __name__ == '__main__':
    unittest.main()
