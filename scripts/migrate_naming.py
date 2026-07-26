import os
import sys
from dotenv import load_dotenv

load_dotenv(".env.local")

# Add root directory to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from backend.database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        tables = [
            "transactions", "accounts", "advances", "archived_users", 
            "audits", "disputes", "drafts", "internal_wallets", 
            "offers", "user_kyc", "vouchers", "beneficiaries"
        ]

        print("--- RUNNING SQL MIGRATIONS ---")

        # 1. user_id -> owner_id
        for table in tables:
            try:
                # Check if user_id exists
                result = db.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}' AND column_name='user_id'")).fetchone()
                if result:
                    print(f"Renaming user_id -> owner_id in table '{table}'")
                    db.execute(text(f"ALTER TABLE {table} RENAME COLUMN user_id TO owner_id"))
            except Exception as e:
                print(f"Failed user_id rename on {table}: {e}")
                db.rollback()

        # Handle archived_users separately
        try:
            result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='archived_users' AND column_name='original_user_id'")).fetchone()
            if result:
                print("Renaming original_user_id -> original_owner_id in table 'archived_users'")
                db.execute(text("ALTER TABLE archived_users RENAME COLUMN original_user_id TO original_owner_id"))
        except Exception as e:
            print(f"Failed original_user_id rename: {e}")
            db.rollback()

        # 2. trueque_id -> symmetri_id
        try:
            result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='user_kyc' AND column_name='trueque_id'")).fetchone()
            if result:
                print("Renaming trueque_id -> symmetri_id in table 'user_kyc'")
                db.execute(text("ALTER TABLE user_kyc RENAME COLUMN trueque_id TO symmetri_id"))
        except Exception as e:
            print(f"Failed trueque_id rename: {e}")
            db.rollback()

        # 3. status -> kyc_status in users
        try:
            result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='status'")).fetchone()
            if result:
                print("Renaming status -> kyc_status in table 'users'")
                db.execute(text("ALTER TABLE users RENAME COLUMN status TO kyc_status"))
        except Exception as e:
            print(f"Failed status rename: {e}")
            db.rollback()

        # 4. Remove tid from users (if it exists, since symmetri_id is the source of truth)
        try:
            result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='tid'")).fetchone()
            if result:
                print("Renaming tid -> symmetri_id in table 'users'")
                sym_result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='symmetri_id'")).fetchone()
                if sym_result:
                    print("symmetri_id already exists. Dropping tid.")
                    db.execute(text("ALTER TABLE users DROP COLUMN tid"))
                else:
                    db.execute(text("ALTER TABLE users RENAME COLUMN tid TO symmetri_id"))
        except Exception as e:
            print(f"Failed tid rename/drop: {e}")
            db.rollback()

        db.commit()
        print("--- MIGRATIONS COMPLETED ---")
    except Exception as e:
        print("Fatal error:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
