
from typing import Dict, Any
from backend.connectors.base import BaseConnector

class GenericConnector(BaseConnector):
    """
    Fallback connector for countries without specific implementation.
    Reads fees directly from config.
    """
    
    def get_fees(self, tier: str = 'T1') -> Dict[str, float]:
        rail_fees = self.config.get("rail_fee", {})
        selected_fee = rail_fees.get(tier, rail_fees.get("T1", 1.0))
        taxes = self.config.get("taxes", 0.0)
        
        # Generic split assumption since config just gives totals per tier in my updated schema
        # Or rather, let's assume the config structure I put in corridor_config.json
        # "rail_fee": {"T1": 1.0, ...}
        
        return {
            "rail_fee": selected_fee,
            "taxes": taxes
        }

    def verify_identity(self, identifier: str, name: str, account_type: str = 'bank') -> Dict[str, Any]:
        """
        Generic verification - always returns True for now (or could be strict False).
        """
        return {
            "match": True,
            "score": 100,
            "provider": "Generic_Mock",
            "details": "Auto-approved by GenericConnector"
        }
