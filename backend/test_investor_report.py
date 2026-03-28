
import unittest
import sys
import os
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.main import app

class TestInvestorReport(unittest.TestCase):
    
    def setUp(self):
        self.client = TestClient(app)

    def test_report_generation(self):
        # /api/admin/investor-report
        response = self.client.get("/api/admin/investor-report")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # 1. Check Success
        self.assertTrue(data['success'])
        
        # 2. Check Payload
        report = data['report']
        
        # DEBUG: Dump report if score is low
        if report.get("readiness_score") != 100:
             print("\n[DEBUG REPORTDUMP]")
             import json
             with open('debug_investor_dump.json', 'w') as f:
                 json.dump(report, f, indent=2)
             print(report)
        
        self.assertIn("readiness_score", report)
        self.assertEqual(report["readiness_score"], 100, "Investor Readiness should be 100% if system integrity is perfect")
        
        # 3. Check Sections
        sections = report['data']
        self.assertIn("tax", sections)
        self.assertIn("OBBBA", sections['tax']['certificate_id'])
        
        self.assertIn("ai", sections)
        self.assertIn("avg_investigation_ms", sections['ai'])
        
        self.assertIn("fx", sections)
        self.assertLess(sections['fx']['target_variance'], sections['fx']['max_allowed_variance'])
        
        self.assertIn("security", sections)
        self.assertTrue(sections['security']['encryption_active'])
        
        # 4. Check HTML
        self.assertIn("TRUEQUE INVESTOR READINESS: 100%", report['html'])

if __name__ == '__main__':
    unittest.main()
