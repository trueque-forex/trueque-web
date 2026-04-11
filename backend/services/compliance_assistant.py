
from backend.audit_db import AuditDB
from backend.logic.compliance_agent import ComplianceAgent
from backend.database import get_db, SessionLocal # Assuming SessionLocal exists for manual session creation

class ComplianceAssistant:
    @staticmethod
    def investigate_alert(data: dict):
        """
        Handles external compliance alerts (e.g. from Flagright).
        Logs to AuditDB and could trigger auto-freeze logic in the future.
        """
        user_id = data.get("userId")
        tx_id = data.get("transactionId")
        details = f"Rule Triggered: {data.get('triggeredRules', [])} | Transaction: {tx_id}"
        
        print(f"[ComplianceAssistant] Investigating Alert for User {user_id}: {details}")

        # 1. Log to Audit Trail (Raw Alert)
        AuditDB.init_db()
        AuditDB.log_alert(
            user_id=str(user_id),
            alert_type="FLAGRIGHT_ALERT",
            details=details,
            fingerprint="WEBHOOK_LISTENER"
        )
        
        # 2. Trigger Gemini Agent
        # Create a fresh DB session for the agent
        db = SessionLocal()
        try:
            ComplianceAgent.analyze_alert(
                user_id=str(user_id),
                alert_details=details,
                db=db,
                transaction_id=tx_id
            )
        except Exception as e:
            print(f"[ComplianceAssistant] Agent Error: {e}")
        finally:
            db.close()

