
from typing import Dict, Any
from .base import BaseConnector

class SpainConnector(BaseConnector):
    """
    Connector for Spain (ES).
    Uses VoP for identity.
    """
    
    def get_fees(self, tier: str = 'T1') -> Dict[str, float]:
        rail_fees = self.config.get("rail_fee", {})
        selected_fee = rail_fees.get(tier, rail_fees.get("T1", 0.50))
        taxes = self.config.get("taxes", 0.0)
        
        return {
            "rail_fee": selected_fee,
            "taxes": taxes,
            "provider_fee": 0.10 # Example internal provider cost
        }

    def verify_identity(self, identifier: str, name: str, account_type: str = 'bank') -> Dict[str, Any]:
        """
        Mock implementation of EU Verification of Payee (VoP).
        """
        normalized_input = name.lower().strip()
        
        if "ben" in normalized_input or "valid" in normalized_input:
            return {
                "match": True,
                "score": 100,
                "provider": "IberPay_VoP",
                "canonical_name": name.upper(),
                "details": "Perfect match (SpainConnector)"
            }
        
        return {
            "match": False,
            "score": 0,
            "provider": "IberPay_VoP",
            "reason": "Name mismatch (SpainConnector)"
        }
