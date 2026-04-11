
import unittest
import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.logic.fee_calculator import FeeCalculator

class TestFriction(unittest.TestCase):
    def test_friction_calculation_us_ar(self):
        """
        Scenario: US -> AR
        Principal: $100.00
        Inbound: Credit Card (US)
        Outbound: Visa Direct (AR)
        
        Config Checks:
        - Liquidity: 0.1% ($0.10)
        - Trueque: $1.50
        - Tax (US): 0% ($0.00)
        - Inbound (Credit Card US): 2.9% + 0.30 -> (100 * 0.029) + 0.30 = 2.90 + 0.30 = 3.20
        - Outbound (Visa Direct AR): $1.50 (Fixed)
        
        Expected Total Friction: 0.10 + 1.50 + 0.00 + 3.20 + 1.50 = 6.30
        Expected Gross Payment: 106.30
        """
        
        result = FeeCalculator.calculate_friction(
            source_country="US",
            dest_country="AR",
            amount_principal=100.00,
            inbound_method="credit_card",
            outbound_method="visa_direct"
        )
        
        print("\n\nFriction Breakdown (US->AR):")
        print(json.dumps(result, indent=2))
        
        breakdown = result["breakdown"]
        
        # 1. Sacred Principal
        self.assertEqual(result["sacred_principal"], 100.00)
        
        # 2. Inbound (3.20)
        self.assertEqual(breakdown["inbound_friction"], 3.20)
        
        # 3. Outbound (1.50)
        self.assertEqual(breakdown["outbound_friction"], 1.50)
        
        # 4. Liquidity (0.10)
        self.assertEqual(breakdown["liquidity_buffer"], 0.10)
        
        # 5. Trueque (1.50)
        self.assertEqual(breakdown["trueque_fee"], 1.50)
        
        # 6. Tax (0.00)
        self.assertEqual(breakdown["local_tax"], 0.00)
        
        # 7. Total
        self.assertEqual(result["total_friction"], 6.30)
        self.assertEqual(result["gross_payment_amount"], 106.30)

if __name__ == '__main__':
    unittest.main()
