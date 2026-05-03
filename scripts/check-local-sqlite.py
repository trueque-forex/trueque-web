
import sqlite3
import json
import os

def check_db(db_name):
    print(f"--- CHECKING {db_name} ---")
    if not os.path.exists(db_name):
        print(f"File {db_name} not found.")
        return
    
    try:
        conn = sqlite3.connect(db_name)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print(f"Table 'users' not found in {db_name}")
            return

        cursor.execute("SELECT id, email, tid, trueque_id, created_at FROM users ORDER BY created_at DESC LIMIT 5")
        rows = cursor.fetchall()
        print(json.dumps([dict(row) for row in rows], indent=2))
        
        conn.close()
    except Exception as e:
        print(f"Error checking {db_name}: {e}")

if __name__ == "__main__":
    check_db('trueque.db')
    check_db('trueque_dev.db')
    check_db('test.db')
    check_db('backend/trueque.db')
