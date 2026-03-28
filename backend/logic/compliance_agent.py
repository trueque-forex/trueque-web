
import json
from sqlalchemy.orm import Session
from backend.models.offer_model import Offer
from backend.audit_db import AuditDB
# from backend.services.gemini_service import GeminiService # Future integration

class ComplianceAgent:
    
    SYSTEM_INSTRUCTION = (
        "You are the Trueque Chief Compliance Officer. Your goal is to provide a 'Good Faith' "
        "narrative for a flagged transaction. Compare the current flag against the user's social purpose "
        "(e.g., family support) and historical behavior. Be concise and recommend: "
        "[APPROVE], [FREEZE], or [ESCALATE]."
    )

    @staticmethod
    def _fetch_enrichment_data(user_id: str, db: Session) -> dict:
        """
        Fetches last 5 transactions to build context.
        """
        recent_txs = db.query(Offer).filter(Offer.user_id == user_id)\
            .order_by(Offer.timestamp.desc()).limit(5).all()
            
        history = []
        for tx in recent_txs:
            history.append({
                "amount": tx.amount,
                "currency": tx.currency_to,
                "purpose": tx.remittance_purpose,
                "date": str(tx.timestamp)
            })
            
        return {"history": history}

    @staticmethod
    def _mock_gemini_call(prompt: str) -> str:
        """
        Simulates the LLM response.
        In prod, this calls Google Vertex AI / Gemini API.
        """
        # Logic: If purpose is FAMILY_SUPPORT, usually approve.
        if "FAMILY_SUPPORT" in prompt:
            return (
                "Thought Process: The user has a consistent history of small remittances for 'FAMILY_SUPPORT'. "
                "The flagged velocity is marginally above limit but consistent with payday patterns. "
                "No signs of structuring or money laundering.\n"
                "Recommendation: [APPROVE]"
            )
        else:
             return (
                "Thought Process: The user's behavior is erratic and purpose is unclear. "
                "High risk of structuring.\n"
                "Recommendation: [ESCALATE]"
            )

    @classmethod
    def analyze_alert(cls, user_id: str, alert_details: str, db: Session, transaction_id: str = None):
        """
        Main Agent Loop.
        """
        # 1. Enrich
        context = cls._fetch_enrichment_data(user_id, db)
        
        # 2. Construct Prompt
        prompt = (
            f"System: {cls.SYSTEM_INSTRUCTION}\n"
            f"Context: User History: {json.dumps(context)}\n"
            f"Alert: {alert_details}\n"
            f"Task: Analyze and Recommend."
        )
        
        # 3. Call Gemini
        response = cls._mock_gemini_call(prompt)
        
        # 4. Parse Recommendation
        recommendation = "UNKNOWN"
        if "[APPROVE]" in response:
            recommendation = "APPROVE"
        elif "[FREEZE]" in response:
            recommendation = "FREEZE"
        elif "[ESCALATE]" in response:
            recommendation = "ESCALATE"
            
        # 5. Audit Commitment (The "Why")
        AuditDB.log_alert(
            user_id=user_id,
            alert_type="GEMINI_DECISION",
            details=response,
            fingerprint="GEMINI_AGENT_V1"
        )
        
        print(f"[Gemini Agent] Recommendation for {user_id}: {recommendation}")
        
        # 6. Auto-Action
        if recommendation == "APPROVE" and transaction_id:
            # Find and update transaction
            # Assuming transaction_id maps to Offer.uuid (e.g. "TX-...") or Offer.id
            # The Webhook might pass "transactionId".
            pass 
            # Real implementation would update DB here.
            # We'll return the decision for the caller to act or do it here if we find the row.
            
            offer = db.query(Offer).filter(Offer.uuid == transaction_id).first()
            if offer:
                offer.status = "MATCHED" # Auto-Approve
                offer.finalized = True # If that's a field, or just status
                db.commit()
                print(f"[Gemini Agent] Auto-Approved Transaction {transaction_id}")
                
        return recommendation
