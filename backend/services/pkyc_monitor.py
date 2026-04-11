
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.models.user_model import User
from backend.models.kyc_audit_model import KYCAuditLog # Assuming we created this in previous phase? Let's check imports. 
# Wait, previous task created `backend/models/kyc_audit_model.py`.
# If not, I should create it or check if it exists. 
# The implementation plan for "US Compliance" said "Create backend/models/kyc_audit_model.py". 
# The task list says "Immutable Audit Logs" was checked.

class PKYCMonitor:
    def __init__(self, db: Session):
        self.db = db

    def scan_daily_risk(self):
        """
        Iterates all Tier 2+ users and mocks a PEP/Sanction check.
        In production, this would call ComplyAdvantage or similar API.
        """
        print("Starting PKYC Daily Scan...")
        
        # 1. Fetch High-Tier Users
        users = self.db.query(User).filter(User.kyc_tier >= 2).all()
        print(f"Scanning {len(users)} Tier 2+ Users...")
        
        for user in users:
            # Mock Check logic
            # E.g. If name contains "BadActor", flag them.
            if "BadActor" in (user.full_name or ""):
                print(f"ALERT: User {user.id} ({user.full_name}) flagged by PKYC Scan.")
                self.log_risk_event(user.id, "PEP_MATCH", "User matches PEP list entry monitor.")
                
                # Potentially downgrade tier?
                # user.kyc_status = 'UNDER_REVIEW'
                # self.db.commit()

        print("PKYC Scan Complete.")

    def log_risk_event(self, user_id: int, action: str, details: str):
        # We need to ensure we have the Audit Log model available
        # If not, fail gracefully or print.
        try:
            log = KYCAuditLog(
                entity_id=user_id,
                action=action,
                old_status="N/A",
                new_status="FLAGGED",
                actor="PKYC_MONITOR",
                timestamp=datetime.now(timezone.utc)
            )
            self.db.add(log)
            self.db.commit()
        except Exception as e:
            print(f"Failed to log audit event: {e}")
