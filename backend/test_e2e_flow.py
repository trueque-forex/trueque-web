import os
import sys
import unittest
from datetime import datetime

# Add path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.fee_orchestrator import FeeOrchestrator
from backend.controllers.payment_controller import PaymentController

class TestTruequeE2E(unittest.TestCase):
    def setUp(self):
        self.orchestrator = FeeOrchestrator()
        self.controller = PaymentController()
        # Ensure Holiday Mode is OFF by default
        if 'HOLIDAY_MODE' in os.environ:
            del os.environ['HOLIDAY_MODE']

    def test_1_identity_and_routing(self):
        print("\n=== TEST 1: Identity & Routing (The Two-Key Check) ===")
        user_id = "T20251226ES0001K"
        # Determine Source Country from ID
        country_from = self.orchestrator._parse_country_from_id(user_id)
        print(f"User ID: {user_id} -> Parsed Country: {country_from}")
        self.assertEqual(country_from, "ES", "Identity Parsing failed. Expected ES.")
        
        # Verify Routing Rules (Mock: Assuming Controller or Frontend uses this parsing)
        # Simply verifying the orchestrator uses this Country for Quote Defaults
        quote = self.controller.get_authorization_quote(
            amount_send=100.0,
            currency_from='EUR',
            currency_to='ARS',
            mid_market_rate=1000.0,
            trueque_id=user_id
        )
        self.assertEqual(quote['corridor'], "ES-AR", "Routing logic failed. Expected ES-AR corridor.")
        print("✅ Identity Routed correctly to Spain Origin.")

    def test_2_fee_transparency_optimal(self):
        print("\n=== TEST 2: Fee Transparency (Optimal RTP) ===")
        # RTP -> RTP should be $0.00
        quote = self.controller.get_authorization_quote(
            amount_send=100.0,
            currency_from='USD',
            currency_to='USD', # Testing Domestic/RTP logic
            mid_market_rate=1.0,
            payment_method='bank_transfer',
            outbound_method='bank_rtp',
            trueque_id='T20251226US0001K'
        )
        bd = quote['breakdown']
        print(f"RTP Fees: Inbound={bd['inbound_fee']}, Outbound={bd['gateway_outbound_fee']}")
        self.assertEqual(bd['inbound_fee'], 0.0)
        self.assertEqual(bd['gateway_outbound_fee'], 0.0)
        print("✅ Optimal Path confirmed Free.")

    def test_3_fee_transparency_convenience(self):
        print("\n=== TEST 3: Fee Transparency (Card Convenience) ===")
        # Card -> Visa Direct should have fees
        quote = self.controller.get_authorization_quote(
            amount_send=1000.0,
            currency_from='USD',
            currency_to='ARS',
            mid_market_rate=1200.0,
            payment_method='card',
            outbound_method='card_push',
            trueque_id='T20251226US0001K'
        )
        bd = quote['breakdown']
        print(f"Card Fees: Inbound={bd['inbound_fee']}, Liquidity={bd['liquidity_fee']}, Outbound={bd['gateway_outbound_fee']}")
        
        self.assertGreater(bd['inbound_fee'], 0)
        self.assertGreater(bd['liquidity_fee'], 0)
        self.assertGreater(bd['gateway_outbound_fee'], 0)
        print("✅ Convenience Path confirmed with correct Friction.")

    def test_4_privacy_and_orchestration(self):
        print("\n=== TEST 4: Privacy & Non-Custodial Orchestration ===")
        # Verify trigger_payout does not accept PII details, only ID
        # Using a mock TxID
        tx_id = "tx_secure_123"
        quote_details = {
            "principal_amount": 100.0,
            "net_payout_amount": 95.0,
            "total_cost_to_sender": 105.0,
            "target_currency": "EUR"
        }
        
        # Valid Call
        result = self.controller.trigger_payout(tx_id, quote_details)
        print(f"Payout Result: {result}")
        
        self.assertTrue(result['success'])
        self.assertEqual(result['gateway'], "SEPA") # Correctly routed to SEPA for ES+IBAN
        self.assertNotIn("name", result, "PII should not be returned indiscriminately")
        print("✅ Payout Triggered Privacy-Preserving Logic.")

        # Verify Webhook
        webhook_payload = {
            "transaction_id": tx_id,
            "status": "authorized",
            "payment_method": "card"
        }
        webhook_res = self.controller.handle_webhook(webhook_payload)
        print(f"Webhook Result: {webhook_res}")
        self.assertEqual(webhook_res['action'], "liquidity_advance_triggered")
        print("✅ Webhook triggered Liquidity Advance Protocol.")

    def test_5_edge_case_holiday_scaling(self):
        print("\n=== TEST 5: Edge Case - Holiday Fee Scaling ===")
        # 1. Get Normal Quote (AR)
        quote_normal = self.controller.get_authorization_quote(
            amount_send=1000.0,
            currency_from='USD',
            currency_to='ARS',
            mid_market_rate=1200.0,
            payment_method='card', # Needs card for liquidity fee
            outbound_method='bank_rtp',
            trueque_id='T20251226US0001K',
        )
        liq_fee_normal = quote_normal['breakdown']['liquidity_fee']
        print(f"Normal Liquidity Fee (AR): {liq_fee_normal}")

        # 2. Enable Holiday Mode -> AR
        os.environ['HOLIDAY_MODE'] = 'AR'
        
        # 3. Get Holiday Quote
        quote_holiday = self.controller.get_authorization_quote(
            amount_send=1000.0,
            currency_from='USD',
            currency_to='ARS',
            mid_market_rate=1200.0,
            payment_method='card',
            outbound_method='bank_rtp',
            trueque_id='T20251226US0001K',
        )
        liq_fee_holiday = quote_holiday['breakdown']['liquidity_fee']
        print(f"Holiday Liquidity Fee (AR): {liq_fee_holiday}")
        
        # Verify Scaling (Assuming 2x multiplier from code)
        self.assertAlmostEqual(liq_fee_holiday, liq_fee_normal * 2.0, delta=0.01)
        print("✅ Holiday Logic correctly scaled fees.")

if __name__ == '__main__':
    unittest.main()
