
from typing import Dict, Any
from .base import BaseConnector

class ArgentinaConnector(BaseConnector):
    """
    Connector for Argentina (AR).
    Uses COELSA for identity.
    """
    
    def get_fees(self, tier: str = 'T1') -> Dict[str, float]:
        rail_fees = self.config.get("rail_fee", {})
        selected_fee = rail_fees.get(tier, rail_fees.get("T1", 500.00))
        taxes = self.config.get("taxes", 150.00)
        
        return {
            "rail_fee": selected_fee,
            "taxes": taxes,
            "provider_fee": 50.0 # COELSA fee
        }

    def verify_identity(self, identifier: str, name: str, account_type: str = 'bank') -> Dict[str, Any]:
        """
        Mock implementation of COELSA / BCRA Alias API.
        """
        is_alias = not identifier.isdigit()
        
        if is_alias and "error" in identifier.lower():
             return {
                "match": False,
                "score": 0,
                "provider": "COELSA",
                "reason": "Alias not found (ArgentinaConnector)"
            }

        normalized_input = name.lower().strip()
        
        if "ben" in normalized_input or "juan" in normalized_input:
            return {
                "match": True,
                "score": 95,
                "provider": "COELSA",
                "canonical_name": name.upper(),
                "cuit": "20-12345678-9",
                "bank": "Banco Galicia"
            }
            
        return {
            "match": False,
            "score": 20,
            "provider": "COELSA",
            "reason": "Name mismatch (ArgentinaConnector)",
            "canonical_name": "ROBERTO GOMEZ" 
        }
