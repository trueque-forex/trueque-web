import unittest
from sqlalchemy import text
from backend.database import SessionLocal
from backend.models.user_model import User
from backend.models.draft_model import Draft
from backend.models.transaction import Transaction

class TestAntonioNuevoFlow(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Cleanup - Use try/except to avoid failure if tables empty
        # try:
        #     self.db.execute(text("DELETE FROM drafts WHERE user_id LIKE 'antonio%'"))
        #     self.db.execute(text("DELETE FROM users WHERE email='antonio.nuevo@test.com'"))
        #     # Also clean transactions
        #     self.db.execute(text("DELETE FROM transactions WHERE user_id LIKE 'antonio%'"))
        #     self.db.commit()
        # except Exception:
        #     self.db.rollback()

    def tearDown(self):
        self.db.close()

    def test_antonio_journey(self):
        print("\n=== ANTONIO NUEVO JOURNEY START ===")
        
        # 1. Signup
        print("\n[Step 1] Signup")
        user = User(
            id="antonio-uuid-123",
            email="antonio.nuevo@test.com",
            first_name="Antonio",
            last_name="Nuevo",
            trueque_id="T20251226MX0001K",
            country_of_residence="MX",
            tx_count=0
        )
        try:
            self.db.add(user)
            self.db.commit()
            print("✅ User Created: Antonio Nuevo (MX)")
        except Exception as e:
            print("INSERT FAILED")
            if hasattr(e, 'statement'):
                print(f"Statement: {e.statement}")
            raise e

        """
        # 2. He creates a Draft (Save for Later)
        print("\n[Step 2] Save Draft")
        draft_data = {
            "amount": 1500.0,
            "currency_from": "MXN",
            "currency_to": "USD",
            "recipient": "Maria"
        }
        draft = Draft(
            user_id="antonio-uuid-123", # Use ID directly string
            step="offers",
            data=draft_data,
            status="active"
        )
        self.db.add(draft)
        self.db.commit()
        print(f"✅ Draft Saved: {draft.id}")

        # 3. Simulate Dashboard Fetch
        print("\n[Step 3] Dashboard Load")
        fetched_draft = self.db.query(Draft).filter(Draft.user_id == "antonio-uuid-123", Draft.status == "active").first()
        self.assertIsNotNone(fetched_draft)
        self.assertEqual(fetched_draft.data['amount'], 1500.0)
        print("✅ Dashboard found the draft.")

        # 4. Conversion (Simulated)
        print("\n[Step 4] Convert to Transaction")
        
        # Lock Draft
        fetched_draft.status = "converted"
        
        # Create Tx
        tx = Transaction(
            id="tx_antonio_001",
            user_id="antonio-uuid-123",
            from_currency="MXN",
            to_currency="USD",
            amount=1500.0,
            exchange_rate=0.05,
            status="pending",
            transaction_type="TYPE_DOMESTIC_P2P_MATCH"
        )
        self.db.add(tx)
        
        # Convert user to Approved
        user_ref = self.db.query(User).filter(User.id == "antonio-uuid-123").first()
        user_ref.tx_count = 1
        self.db.commit()
        print("✅ Transaction Created. Draft Locked.")
        
        # 5. Verify Final State
        final_draft = self.db.query(Draft).filter(Draft.id == fetched_draft.id).first()
        final_user = self.db.query(User).filter(User.id == "antonio-uuid-123").first()
        
        self.assertEqual(final_draft.status, "converted")
        self.assertEqual(final_user.tx_count, 1)
        print("✅ Final State Verified.")
        """
        print("\n=== ANTONIO NUEVO JOURNEY COMPLETE ===")
        draft_data = {
            "amount": 1500.0,
            "currency_from": "MXN",
            "currency_to": "USD",
            "recipient": "Maria"
        }
        draft = Draft(
            user_id="antonio-uuid-123", # Use ID directly string
            step="offers",
            data=draft_data,
            status="active"
        )
        self.db.add(draft)
        self.db.commit()
        print(f"✅ Draft Saved: {draft.id}")

        # 3. Simulate Dashboard Fetch
        print("\n[Step 3] Dashboard Load")
        fetched_draft = self.db.query(Draft).filter(Draft.user_id == "antonio-uuid-123", Draft.status == "active").first()
        self.assertIsNotNone(fetched_draft)
        self.assertEqual(fetched_draft.data['amount'], 1500.0)
        print("✅ Dashboard found the draft.")

        # 4. Conversion (Simulated)
        print("\n[Step 4] Convert to Transaction")
        
        # Lock Draft
        fetched_draft.status = "converted"
        
        # Create Tx
        tx = Transaction(
            id="tx_antonio_001",
            user_id="antonio-uuid-123",
            from_currency="MXN",
            to_currency="USD",
            amount=1500.0,
            exchange_rate=0.05,
            status="pending",
            transaction_type="TYPE_DOMESTIC_P2P_MATCH"
        )
        self.db.add(tx)
        
        # Convert user to Approved
        user_ref = self.db.query(User).filter(User.id == "antonio-uuid-123").first()
        user_ref.tx_count = 1
        self.db.commit()
        print("✅ Transaction Created. Draft Locked.")
        
        # 5. Verify Final State
        final_draft = self.db.query(Draft).filter(Draft.id == fetched_draft.id).first()
        final_user = self.db.query(User).filter(User.id == "antonio-uuid-123").first()
        
        self.assertEqual(final_draft.status, "converted")
        self.assertEqual(final_user.tx_count, 1)
        print("✅ Final State Verified.")
        print("\n=== ANTONIO NUEVO JOURNEY COMPLETE ===")

if __name__ == '__main__':
    unittest.main()
