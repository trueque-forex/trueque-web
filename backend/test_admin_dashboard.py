
import unittest
import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import app

class TestAdminDashboard(unittest.TestCase):
    
    def setUp(self):
        self.client = TestClient(app)

    def test_fx_live(self):
        # /api/admin/fx-live
        response = self.client.get("/api/admin/fx-live")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIn("consensus_rate", data['data'])
        self.assertIn("OANDA", data['data']['sources'])

    def test_audit_feed(self):
        # /api/admin/audit-feed
        response = self.client.get("/api/admin/audit-feed?limit=5")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertIsInstance(data['feed'], list)

    def test_security_status(self):
        # /api/admin/security-status
        response = self.client.get("/api/admin/security-status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        vitals = data['vitals']
        self.assertTrue(vitals['field_encryption'], "Encryption should be active")
        self.assertTrue(vitals['blind_indexing'], "Blind Indexing should be active")
        self.assertTrue(vitals['audit_vault_connected'], "Audit Vault should be connected")

    def test_social_subsidy(self):
        # /api/admin/social-subsidy
        response = self.client.get("/api/admin/social-subsidy")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertGreater(data['fund_total'], 0)

if __name__ == '__main__':
    unittest.main()
