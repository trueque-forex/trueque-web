
import sqlite3
import json
import os

def check_audit_alerts():
    db_name = 'audit_trail.db'
    print(f"--- CHECKING {db_name} ---")
    if not os.path.exists(db_name):
        print(f"File {db_name} not found.")
        return
    
    try:
        conn = sqlite3.connect(db_name)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM audit_alerts ORDER BY timestamp DESC LIMIT 10")
        rows = cursor.fetchall()
        print("LATEST AUDIT ALERTS:")
        print(json.dumps([dict(row) for row in rows], indent=2))
        
        conn.close()
    except Exception as e:
        print(f"Error checking audit_trail.db: {e}")

if __name__ == "__main__":
    check_audit_alerts()
