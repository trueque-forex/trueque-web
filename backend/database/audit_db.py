
import sqlite3
import os
from datetime import datetime

class AuditDB:
    @staticmethod
    def get_connection():
        # Using a separate file for Audit Trail
        db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'audit_trail.db')
        conn = sqlite3.connect(db_path)
        return conn

    @staticmethod
    def init_db():
        conn = AuditDB.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS audit_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                alert_type TEXT,
                details TEXT,
                device_fingerprint TEXT,
                timestamp TEXT
            )
        ''')
        conn.commit()
        conn.close()

    @staticmethod
    def log_alert(user_id: str, alert_type: str, details: str, fingerprint: str):
        conn = AuditDB.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO audit_alerts (user_id, alert_type, details, device_fingerprint, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, alert_type, details, fingerprint, datetime.utcnow().isoformat()))
        conn.commit()
        conn.close()
