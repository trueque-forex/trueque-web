
import unittest
import sys
import os
from unittest.mock import patch, MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.services.fx_consensus import FXConsensusService # Correct Import
from backend.audit_db import AuditDB

class TestFXConsensus(unittest.TestCase):
    
    def setUp(self):
        AuditDB.init_db()

    @patch('backend.services.fx_consensus.FXConsensusService._fetch_oanda')
    @patch('backend.services.fx_consensus.FXConsensusService._fetch_chainlink')
    @patch('backend.services.fx_consensus.FXConsensusService._fetch_fixer')
    def test_consensus_median_stable(self, mock_fixer, mock_chainlink, mock_oanda):
        # Setup: Tight spread
        mock_oanda.return_value = 1.0500
        mock_chainlink.return_value = 1.0510
        mock_fixer.return_value = 1.0490 
        
        # Expected Median: 1.0500 (Middle of sorted: 1.0490, 1.0500, 1.0510)
        
        rate, unstable = FXConsensusService.get_consensus_rate("EUR", "USD", "test_user")
        
        self.assertAlmostEqual(rate, 1.0500)
        self.assertFalse(unstable, "Should be stable (Variance < 1%)")
        
        # Verify Audit Log
        conn = AuditDB.get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM audit_alerts WHERE user_id='test_user' AND alert_type='FX_CONSENSUS_QUOTE'")
        row = c.fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertIn("STABLE", row[3])

    @patch('backend.services.fx_consensus.FXConsensusService._fetch_oanda')
    @patch('backend.services.fx_consensus.FXConsensusService._fetch_chainlink')
    @patch('backend.services.fx_consensus.FXConsensusService._fetch_fixer')
    def test_consensus_unstable_variance(self, mock_fixer, mock_chainlink, mock_oanda):
        # Setup: Huge spread (Outlier)
        mock_oanda.return_value = 1.0500
        mock_chainlink.return_value = 1.1500 # +10% 
        mock_fixer.return_value = 1.0500 
        
        # Expected Median: 1.0500 (Sorted: 1.05, 1.05, 1.15)
        # Variance: (1.15 - 1.05) / 1.05 = 0.095 (9.5%) > 1%
        
        rate, unstable = FXConsensusService.get_consensus_rate("EUR", "USD", "test_unstable")
        
        self.assertEqual(rate, 1.0500)
        self.assertTrue(unstable, "Should be flagged UNSTABLE")
        
    @patch('backend.services.fx_consensus.FXConsensusService._fetch_oanda')
    @patch('backend.services.fx_consensus.FXConsensusService._fetch_chainlink')
    @patch('backend.services.fx_consensus.FXConsensusService._fetch_fixer')
    def test_median_logic(self, mock_fixer, mock_chainlink, mock_oanda):
         # 10, 20, 100 -> Median 20
        mock_oanda.return_value = 10.0
        mock_chainlink.return_value = 100.0
        mock_fixer.return_value = 20.0
        
        rate, _ = FXConsensusService.get_consensus_rate("A", "B")
        self.assertEqual(rate, 20.0)

if __name__ == '__main__':
    unittest.main()
