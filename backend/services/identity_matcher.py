
from typing import Dict, Any, Optional
from ..connectors.factory import ConnectorFactory

class IdentityMatcher:
    """
    Service to handle Identity Verification for different corridors.
    Delegates logic to Country Connectors.
    """
    
    def __init__(self):
        self.factory = ConnectorFactory()

    def match_identity(self, country_code: str, identifier: str, name: str, account_type: str = 'bank') -> Dict[str, Any]:
        """
        Routes the identity match request to the appropriate connector logic.
        """
        try:
            connector = self.factory.get_connector(country_code)
            return connector.verify_identity(identifier, name, account_type)
        except Exception as e:
             return {
                "match": False,
                "reason": f"Error loading connector for {country_code}: {str(e)}",
                "provider": "Unknown"
            }
