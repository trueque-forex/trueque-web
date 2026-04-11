
import unittest
import sys
import os
import time
from unittest.mock import MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.kms_service import KMSService
from backend.services.sanctions_screener import SanctionsScreener
from backend.models.user_model import User
from backend.audit_db import AuditDB

class TestBlindIndexing(unittest.TestCase):
    
    def setUp(self):
        AuditDB.init_db()

    def test_blind_indexing_logic(self):
        plaintext_id = "ID_BAD_999"
        
        # 1. Create Data
        enc_id = KMSService.encrypt(plaintext_id)
        bidx_id = KMSService.get_blind_index(plaintext_id)
        
        user = User(id=777, full_name="El Chapo", id_number_enc=enc_id, id_number_bidx=bidx_id)
        
        # 2. Prepare Bad List
        bad_id = "ID_BAD_999"
        bad_hash = KMSService.get_blind_index(bad_id)
        bad_list = [bad_hash, "some_other_hash"]
        
        # 3. Optimized Screen
        is_safe = SanctionsScreener.screen_user_optimized(user, bad_list)
        self.assertFalse(is_safe, "Should be flagged via Blind Index")
        
        # 4. Verify Audit Log (Should exist because confirmation decryption happened)
        conn = AuditDB.get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM audit_alerts WHERE user_id='777' AND alert_type='SANCTIONS_HIT_OPTIMIZED'")
        row = c.fetchone()
        conn.close()
        self.assertIsNotNone(row)

    def test_performance_benchmark(self):
        # Create 1000 users. 1 is bad.
        users = []
        plaintext_good = "ID_GOOD_123"
        plaintext_bad = "ID_BAD_999"
        
        enc_good = KMSService.encrypt(plaintext_good)
        bidx_good = KMSService.get_blind_index(plaintext_good)
        
        enc_bad = KMSService.encrypt(plaintext_bad)
        bidx_bad = KMSService.get_blind_index(plaintext_bad)
        
        bad_hash = bidx_bad
        
        for i in range(1000):
            if i == 500: # One bad apple
                users.append(User(id=i, id_number_enc=enc_bad, id_number_bidx=bidx_bad))
            else:
                users.append(User(id=i, id_number_enc=enc_good, id_number_bidx=bidx_good))
                
        # Method A: Decrypt All (Old Way)
        start_a = time.time()
        hits_a = 0
        for u in users:
            # Manually simulating what screen_user does (decrypt + check string)
            dec = KMSService.decrypt(u.id_number_enc, "BENCHMARK_A", str(u.id))
            if "999" in dec:
                hits_a += 1
        dur_a = time.time() - start_a
        
        # Method B: Blind Index (New Way)
        start_b = time.time()
        hits_b = 0
        for u in users:
            if SanctionsScreener.screen_user_optimized(u, [bad_hash]):
                pass
            else:
                hits_b += 1
        dur_b = time.time() - start_b
        
        print(f"\n[Benchmark] 1000 Users Scan:")
        print(f"Decryption Search: {dur_a:.4f}s")
        print(f"Blind Index Search: {dur_b:.4f}s")
        print(f"Speedup: {dur_a / dur_b:.2f}x")
        
        self.assertEqual(hits_a, hits_b)
        self.assertLess(dur_b, dur_a)

if __name__ == '__main__':
    unittest.main()
