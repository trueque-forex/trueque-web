
from sqlalchemy.orm import Session
from backend.models.offer_model import Offer
from datetime import datetime, timedelta, timezone

class AuditAssistant:
    @staticmethod
    def generate_good_faith_summary(user_id: str, db: Session) -> str:
        """
        Simulates 'Gemini' AI analysis of user history.
        """
        # Fetch recent activity
        now = datetime.now(timezone.utc)
        start_monitor = now - timedelta(hours=24)
        
        txs = db.query(Offer).filter(
            Offer.user_id == user_id,
            Offer.timestamp >= start_monitor
        ).all()
        
        count = len(txs)
        total = sum([float(t.amount) for t in txs])
        
        # Determine purpose (mode)
        purposes = [t.remittance_purpose for t in txs if t.remittance_purpose]
        main_purpose = max(set(purposes), key=purposes.count) if purposes else "Unknown"
        
        # Simulating AI Response style
        summary = (
            f"User {user_id} has {count} swaps today total ${total:.2f}. "
            f"Purpose: {main_purpose}. "
            f"Recommendation: Approve."
        )
        return summary
