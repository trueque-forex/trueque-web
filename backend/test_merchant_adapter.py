import unittest
import json
import os
from datetime import datetime, timezone
from unittest.mock import MagicMock
from backend.services.match_service import MatchService
from backend.common.errors import TruequeError, ErrorCode

class TestMerchantAdapter(unittest.TestCase):
    def setUp(self):
        self.service = MatchService()
        
    def test_config_loading_integrity(self):
        # Verify we can load the corridor config and it has the new keys
        from backend.services.match_service import get_corridor_config
        config = get_corridor_config()
        self.assertIn("NG", config["countries"])
        self.assertIn("merchant_options", config["countries"]["NG"])
        self.assertIn("Electricity Token", config["countries"]["NG"]["merchant_options"])
        
    def test_voucher_backstop_fallback(self):
        # 1. Create a match that looks like it should be backstopped
        match_id = "m_999"
        self.service.matches[match_id] = {
            "id": match_id,
            "user_b": {"status": "PENDING_FUNDING"}, # Logic checks PENDING_FUNDING or PENDING based on implementation
            "currency": "NGN", # Should map to NG
            "dest_country_code": "NG", # If available
            "created_at": datetime(2023, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
            "status": "PENDING"
        }
        
        # 2. Trigger check
        updated = self.service.check_and_convert_to_merchant(match_id)
        
        # 3. Verify
        self.assertIsNotNone(updated)
        self.assertEqual(updated["status"], "MERCHANT_BACKSTOP")
        self.assertIn("merchant_options", updated)
        self.assertIn("Jumia Payload", updated["merchant_options"])

if __name__ == '__main__':
    unittest.main()
