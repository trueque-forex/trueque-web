
import unittest
import sys
import os
import hmac
import hashlib
import json
import time

# Ensure backend modules can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from backend.main import app
from backend.audit_db import AuditDB

class TestFlagrightWebhook(unittest.TestCase):
    
    def setUp(self):
        # Using TestClient for FastAPI integration testing
        self.client = TestClient(app)
        AuditDB.init_db()
        
        # Must match route constant
        self.secret = "sk_live_mock_flagright_secret_123"

    def test_webhook_flow_valid(self):
        # 1. Payload
        payload = {
            "type": "TRANSACTION_MONITORING_RULE_TRIGGERED",
            "transactionId": "tx_mock_999",
            "userId": "user_mock_888",
            "triggeredRules": ["RULE_HIGH_VELOCITY", "RULE_DARK_WEB"]
        }
        payload_bytes = json.dumps(payload).encode()
        
        # 2. Sign
        signature = hmac.new(
            self.secret.encode(),
            payload_bytes,
            hashlib.sha256
        ).hexdigest()
        
        # 3. Request
        response = self.client.post(
            "/api/compliance/webhook/flagright",
            content=payload_bytes, # Raw bytes body
            headers={"x-flagright-signature": signature}
        )
        
        # 4. Assert Immediate Response
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "received"})
        
        # 5. Wait for Background Task
        # TestClient runs background tasks synchronously (usually), but let's check DB.
        # Note: Starlette TestClient executes background tasks after sending response.
        
        conn = AuditDB.get_connection()
        c = conn.cursor()
        c.execute(
            "SELECT * FROM audit_alerts WHERE user_id='user_mock_888' AND alert_type='FLAGRIGHT_ALERT'"
        )
        row = c.fetchone()
        conn.close()
        
        self.assertIsNotNone(row)
        self.assertIn("RULE_HIGH_VELOCITY", row[3]) # Details

    def test_webhook_invalid_signature(self):
        payload = {"type": "ping"}
        response = self.client.post(
            "/api/compliance/webhook/flagright",
            json=payload,
            headers={"x-flagright-signature": "bad_sig"}
        )
        self.assertEqual(response.status_code, 401)
        
if __name__ == '__main__':
    unittest.main()
