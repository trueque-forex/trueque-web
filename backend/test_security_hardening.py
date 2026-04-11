
import unittest
import sys
import os
import json
from unittest.mock import MagicMock
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.kms_service import KMSService
from backend.services.sanctions_screener import SanctionsScreener
from backend.audit_db import AuditDB
from backend.models.user_model import User
from backend.logic.fee_calculator import FeeCalculator

class TestSecurityHardening(unittest.TestCase):
    
    def setUp(self):
        AuditDB.init_db()

    def test_kms_encryption_cycle(self):
        plaintext = "MY_SECRET_ID_123"
        user_id = "u_enc_test"
        
        # Encrypt
        cipher = KMSService.encrypt(plaintext)
        self.assertTrue(cipher.startswith("ENC_"), "Ciphertext should have prefix")
        self.assertNotEqual(cipher, plaintext)
        
        # Decrypt (and triggers audit)
        decrypted = KMSService.decrypt(cipher, "TEST_REASON", user_id)
        self.assertEqual(decrypted, plaintext)
        
        # Verify Audit Log
        conn = AuditDB.get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM audit_alerts WHERE user_id=? AND alert_type='KEY_ACCESS' ORDER BY id DESC LIMIT 1", (user_id,))
        row = c.fetchone()
        conn.close()
        
        self.assertIsNotNone(row)
        self.assertIn("TEST_REASON", row[3]) # Details column

    def test_sanctions_screener(self):
        user = User(id=123, full_name="Pablo Escobar", id_number_enc=KMSService.encrypt("ID_999"))
        
        # Should detect "999" in ID
        is_safe = SanctionsScreener.screen_user(user)
        self.assertFalse(is_safe, "Should be flagged due to 999")
        
        # Verify Sanctions Log
        conn = AuditDB.get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM audit_alerts WHERE user_id='123' AND alert_type='SANCTIONS_HIT'",)
        row = c.fetchone()
        conn.close()
        self.assertIsNotNone(row)

    def test_fee_progressive_rate(self):
        # Scenario: Joao has 300 already. Sends 300. Total 600 (>500).
        # Should be charged 1.2% on the current 300.
        
        mock_db = MagicMock()
        mock_db.query.return_value.filter.return_value.scalar.return_value = 300.0
        
        res = FeeCalculator.calculate_friction(
            "US", "AR", 300.0, "debit_card", "visa_direct", db=mock_db, user_id="joao"
        )
        
        expected_fee = 300 * 0.012 # 3.60
        calc_fee = res['breakdown']['trueque_fee']
        
        self.assertEqual(calc_fee, 3.60)
        
if __name__ == '__main__':
    unittest.main()
