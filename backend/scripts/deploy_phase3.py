
import sqlite3
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.audit_db import AuditDB

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'trueque.db')

def deploy():
    print(">>> Starting Phase 3 Deployment...")
    
    # 1. Initialize Audit Vault
    print("[1/3] Initializing Audit Vault (audit_trail.db)...")
    AuditDB.init_db()
    print("      Done.")
    
    # 2. Update Main Database (trueque.db)
    print("[2/3] Migrating Main Database Schema...")
    if not os.path.exists(DB_PATH):
        print(f"      Database not found at {DB_PATH}. Skipping migration (will be created on first run).")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get existing columns
    cursor.execute("PRAGMA table_info(users)")
    columns = [info[1] for info in cursor.fetchall()]
    
    new_columns = [
        ("dob_enc", "TEXT"),
        ("ssn_enc", "TEXT"),
        ("id_number_enc", "TEXT"),
        ("dob_bidx", "TEXT"),
        ("ssn_bidx", "TEXT"),
        ("id_number_bidx", "TEXT")
    ]
    
    added_count = 0
    for col_name, col_type in new_columns:
        if col_name not in columns:
            print(f"      Adding column: {col_name} ({col_type})")
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                added_count += 1
            except Exception as e:
                print(f"      Error adding {col_name}: {e}")
        else:
            print(f"      Column {col_name} already exists.")
            
    conn.commit()
    conn.close()
    print(f"      Migration Complete. Added {added_count} columns.")

    # 3. Final Check
    print("[3/3] Final System Check...")
    # Verify Audit DB connection
    try:
        conn = AuditDB.get_connection()
        conn.close()
        print("      Audit DB Connection: OK")
    except Exception as e:
        print(f"      Audit DB Verification Failed: {e}")
        sys.exit(1)

    print("\n>>> DEPLOYMENT SUCCESSFUL <<<")

if __name__ == "__main__":
    deploy()
