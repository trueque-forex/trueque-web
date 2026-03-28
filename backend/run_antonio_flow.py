from backend.database import SessionLocal
from backend.models.user_model import User
from backend.models.draft_model import Draft
from backend.models.transaction import Transaction
from sqlalchemy import text

def run_flow():
    print("STARTING ANTONIO FLOW")
    db = SessionLocal()
    try:
        # Cleanup
        try:
            db.execute(text("DELETE FROM transactions WHERE user_id LIKE 'antonio%'"))
            db.execute(text("DELETE FROM drafts WHERE user_id LIKE 'antonio%'"))
            db.execute(text("DELETE FROM users WHERE email='antonio.nuevo@test.com'"))
            db.commit()
            print("Cleanup Success")
        except Exception as e:
            print("Cleanup Ignored:", e)
            db.rollback()

        # 1. Signup
        user = User(
            id="antonio-uuid-123",
            email="antonio.nuevo@test.com",
            trueque_id="T20251226MX0001K",
            first_name="Antonio",
            last_name="Nuevo",
            country_of_residence="MX",
            tx_count=0
        )
        db.add(user)
        db.commit()
        print("✅ User Created: Antonio Nuevo (MX)")

        # 2. Draft
        print("\n[Step 2] Save Draft")
        draft_data = {
            "amount": 1500.0,
            "currency_from": "MXN",
            "currency_to": "USD",
            "recipient": "Maria"
        }
        draft = Draft(
            user_id="antonio-uuid-123",
            step="offers",
            data=draft_data,
            status="active"
        )
        db.add(draft)
        db.commit()
        print(f"✅ Draft Saved: {draft.id}")

        # 3. Fetch
        print("\n[Step 3] Dashboard Load")
        fetched_draft = db.query(Draft).filter(Draft.user_id == "antonio-uuid-123", Draft.status == "active").first()
        if fetched_draft and fetched_draft.data['amount'] == 1500.0:
             print("✅ Dashboard found the draft.")
        else:
             print("❌ Dashboard draft check failed")
             return

        # 4. Conversion
        print("\n[Step 4] Convert to Transaction")
        fetched_draft.status = "converted"
        
        tx = Transaction(
            tx_id="tx_antonio_001",
            user_id="antonio-uuid-123",
            from_currency="MXN",
            to_currency="USD",
            amount=1500.0,
            rate=0.05,
            status="pending",
            transaction_type="TYPE_DOMESTIC_P2P_MATCH"
        )
        db.add(tx)
        
        user_ref = db.query(User).filter(User.id == "antonio-uuid-123").first()
        user_ref.tx_count = 1
        db.commit()
        print("✅ Transaction Created. Draft Locked.")

        # 5. Verify
        # Refresh session to ensure we get DB state
        db.expire_all()
        final_user = db.query(User).filter(User.id == "antonio-uuid-123").first()
        if final_user.tx_count == 1:
            print("✅ Final State Verified.")
        else:
            print(f"❌ Final state check failed: tx_count={final_user.tx_count}")

        print("\n=== ANTONIO NUEVO JOURNEY COMPLETE ===")

    except Exception as e:
        print(f"\n❌ FLOW FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_flow()
