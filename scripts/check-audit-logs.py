
import sqlite3
import json
import os

def check_audit():
    db_name = 'audit_trail.db'
    print(f"--- CHECKING {db_name} ---")
    if not os.path.exists(db_name):
        print(f"File {db_name} not found.")
        return
    
    try:
        conn = sqlite3.connect(db_name)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        raw_tables = cursor.fetchall()
        tables = [row[0] for row in raw_tables]
        print(f"Tables: {tables}")

        if 'alerts' in tables:
            cursor.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10")
            rows = cursor.fetchall()
            print("LATEST ALERTS:")
            print(json.dumps([dict(row) for row in rows], indent=2))
        
        conn.close()
    except Exception as e:
        print(f"Error checking audit_trail.db: {e}")

if __name__ == "__main__":
    check_audit()
