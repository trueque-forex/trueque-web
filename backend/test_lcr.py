
import unittest
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.logic.fee_calculator import FeeCalculator
import json

class TestLCR(unittest.TestCase):
    def test_calculate_best_route_es_ar(self):
        # Scenario: ES -> AR
        # Bizum -> Transferencia 3.0 (0% Fee)
        options = FeeCalculator.calculate_best_route("AR", 100.00, "ARS")
        
        print("\n\nLCR Options (AR):")
        print(json.dumps(options, indent=2))
        
        self.assertTrue(len(options) > 0)
        best = options[0]
        self.assertEqual(best['method'], "bank_rtp")
        self.assertEqual(best['rail_cost'], 0.0)
        self.assertIn("Trueque Social Pick", best['promo_label'])

    def test_calculate_best_route_mx(self):
        # Scenario: ES -> MX
        # OXXO has no specific rail fee logic in current config map? 
        # Checking if it picks up bank_rtp (SPEI) as default
        options = FeeCalculator.calculate_best_route("MX", 100.00, "MXN")
        
        print("\n\nLCR Options (MX):")
        print(json.dumps(options, indent=2))
        
        best = options[0]
        self.assertEqual(best['method'], "bank_rtp") # SPEI is 0%
        self.assertEqual(best['rail_cost'], 0.0)

if __name__ == '__main__':
    unittest.main()
