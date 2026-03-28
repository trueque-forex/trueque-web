
import unittest
import sys
import os
import json
from unittest.mock import MagicMock
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.logic.compliance_agent import ComplianceAgent
from backend.audit_db import AuditDB
from backend.models.offer_model import Offer

class TestComplianceAgent(unittest.TestCase):
    
    def setUp(self):
        AuditDB.init_db()

    def test_agent_approve_flow(self):
        # 1. Setup Mock DB
        mock_db = MagicMock()
        
        # Mock Offers for history
        o1 = Offer(amount=50, currency_from="USD", currency_to="MXN", remittance_purpose="FAMILY_SUPPORT", timestamp=datetime.now())
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [o1, o1]
        
        # Mock Transaction for update
        mock_offer_row = MagicMock()
        mock_offer_row.status = "STATUS_AUDIT_PENDING"
        # When querying for specific tx_id, return this row
        mock_db.query.return_value.filter.return_value.first.return_value = mock_offer_row
        
        # 2. Trigger Agent (with "FAMILY_SUPPORT" in alert to trigger Mocked Approve)
        # Note: _mock_gemini_call checks for "FAMILY_SUPPORT" in PROMPT.
        # Enriched context has "FAMILY_SUPPORT", so prompt will have it.
        
        decision = ComplianceAgent.analyze_alert(
            user_id="u_good_so", 
            alert_details="Velocity Warning", 
            db=mock_db,
            transaction_id="tx_123"
        )
        
        # 3. Assertions
        self.assertEqual(decision, "APPROVE")
        self.assertEqual(mock_offer_row.status, "MATCHED") # Auto-Update
        
        # Verify Audit Log
        conn = AuditDB.get_connection()
        c = conn.cursor()
        c.execute("SELECT * FROM audit_alerts WHERE user_id='u_good_so' AND alert_type='GEMINI_DECISION'")
        row = c.fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertIn("Recommendation: [APPROVE]", row[3])

    def test_agent_escalate_flow(self):
        # 1. Setup Mock DB (No family support history)
        mock_db = MagicMock()
        o1 = Offer(amount=900, currency_from="USD", currency_to="NGN", remittance_purpose="Crypto Purchase", timestamp=datetime.now())
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [o1]
        
        # 2. Trigger Agent (Alert details generic)
        decision = ComplianceAgent.analyze_alert(
            user_id="u_bad_guy", 
            alert_details="Structuring Detected", 
            db=mock_db,
            transaction_id="tx_999"
        )
        
        # 3. Assertions
        self.assertEqual(decision, "ESCALATE")
        
if __name__ == '__main__':
    unittest.main()
