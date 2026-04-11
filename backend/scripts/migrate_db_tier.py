
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'trueque.db')

def migrate():
    print(f"Migrating DB at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Add kyc_tier if missing
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN kyc_tier INTEGER DEFAULT 0")
        print("Added kyc_tier column.")
    except sqlite3.OperationalError as e:
        print(f"kyc_tier exists or error: {e}")

    # 2. Add user_type if missing (from previous task, just in case)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN user_type VARCHAR DEFAULT 'PEER'")
        print("Added user_type column.")
    except sqlite3.OperationalError as e:
        print(f"user_type exists or error: {e}")
        
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
