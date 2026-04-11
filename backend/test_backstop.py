import unittest
from datetime import datetime, timedelta, timezone
from backend.services.match_service import MatchService

class TestMatchServiceBackstop(unittest.TestCase):
    def setUp(self):
        self.service = MatchService()

    def test_voucher_backstop_conversion(self):
        # 1. Create a match
        match = self.service.create_match("m_123", "u_1", "u_2", 100.0, "NGN")
        
        # 2. Backdate it by 3 minutes (exceeding 2 min limit)
        match["created_at"] = datetime.now(timezone.utc) - timedelta(minutes=3)
        
        # 3. Run backstop check
        self.service.check_and_convert_to_merchant("m_123")
        
        # 4. Verify status is now MERCHANT_BACKSTOP
        updated_match = self.service.get_match("m_123")
        self.assertEqual(updated_match["status"], "MERCHANT_BACKSTOP")

    def test_voucher_backstop_no_conversion_within_window(self):
        # 1. Create a match
        match = self.service.create_match("m_456", "u_3", "u_4", 100.0, "NGN")
        
        # 2. Backdate by 1 minute (within limit)
        match["created_at"] = datetime.now(timezone.utc) - timedelta(minutes=1)
        
        # 3. Run check
        self.service.check_and_convert_to_merchant("m_456")
        
        # 4. Verify status is still CREATED
        updated_match = self.service.get_match("m_456")
        self.assertEqual(updated_match["status"], "CREATED")

if __name__ == '__main__':
    unittest.main()
