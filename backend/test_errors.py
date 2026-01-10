import unittest
from backend.services.match_service import MatchService
from backend.common.errors import TruequeError, ErrorCode

class TestErrorRegistry(unittest.TestCase):
    def setUp(self):
        self.service = MatchService()

    def test_update_status_not_found(self):
        with self.assertRaises(TruequeError) as cm:
            self.service.update_funding_status("invalid_id", "user_a", "FUNDED")
        
        self.assertEqual(cm.exception.code, ErrorCode.RESOURCE_NOT_FOUND)
        self.assertEqual(cm.exception.status_code, 404)

    def test_update_status_invalid_role(self):
        self.service.create_match("m_1", "u1", "u2", 100, "USD")
        
        with self.assertRaises(TruequeError) as cm:
            self.service.update_funding_status("m_1", "invalid_role", "FUNDED")
            
        self.assertEqual(cm.exception.code, ErrorCode.VALIDATION_ERROR)
        self.assertEqual(cm.exception.status_code, 400)

if __name__ == '__main__':
    unittest.main()
