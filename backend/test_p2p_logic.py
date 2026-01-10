import unittest
import os
import sys
from datetime import datetime, timedelta

# Add path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.controllers.payment_controller import PaymentController

class TestP2PLogic(unittest.TestCase):
    def setUp(self):
        self.controller = PaymentController()
        # Mocking Match Service data directly for control
        self.match_id = "m_123"
        self.user_a = "u_A"
        self.user_b = "u_B"
        
        # Create a fresh match
        self.controller.match_service.create_match(
            self.match_id, self.user_a, self.user_b, 100.0, "USD"
        )

    def test_dual_funding_trigger(self):
        print("\n=== TEST P2P: Dual Funding Logic ===")
        
        # 1. Webhook for User A
        payload_a = {
            "event_type": "payment_confirmed",
            "match_id": self.match_id,
            "role": "user_a",
            "status": "FUNDED",
            "transaction_id": "tx_a_1"
        }
        res_a = self.controller.handle_webhook(payload_a)
        print(f"User A Result: {res_a}")
        self.assertEqual(res_a['action'], "match_updated_waiting_peer")
        
        # Verify State
        match = self.controller.match_service.get_match(self.match_id)
        self.assertEqual(match['user_a']['status'], "FUNDED")
        self.assertEqual(match['user_b']['status'], "PENDING_FUNDING")

        # 2. Webhook for User B
        payload_b = {
            "event_type": "payment_confirmed",
            "match_id": self.match_id,
            "role": "user_b",
            "status": "FUNDED",
            "transaction_id": "tx_b_1"
        }
        res_b = self.controller.handle_webhook(payload_b)
        print(f"User B Result: {res_b}")
        
        # Verify Trigger
        self.assertEqual(res_b['action'], "mirror_payouts_triggered")
        print("✅ Dual Funding correctly triggered Mirror Payouts.")

    def test_timeout_rollback(self):
        print("\n=== TEST P2P: Timeout / Rate Lock Expiry ===")
        # manually age the match
        old_match_id = "m_old"
        self.controller.match_service.create_match(
            old_match_id, self.user_a, self.user_b, 50.0, "EUR"
        )
        # Hack the timestamp
        self.controller.match_service.matches[old_match_id]['created_at'] = datetime.now(timezone.utc) - timedelta(minutes=20)
        
        # Check
        res = self.controller.check_timeouts(old_match_id)
        print(f"Timeout Check Result: {res}")
        self.assertEqual(res['status'], "expired")
        self.assertEqual(res['action'], "rollback")
        
        # Verify Status
        match = self.controller.match_service.get_match(old_match_id)
        self.assertEqual(match['status'], "EXPIRED_RELEASED")
        print("✅ Timeout Logic correctly expired and released the match.")

if __name__ == '__main__':
    unittest.main()
