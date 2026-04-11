from abc import ABC, abstractmethod
from typing import Dict, Any

class VoucherMerchantInterface(ABC):
    """
    Standard interface for generating merchant vouchers.
    Any specific merchant (OXXO, MoMo, etc.) must inherit from this.
    """

    @abstractmethod
    def create_offer(self, amount: float, currency: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a voucher code or payment instruction.
        Returns a dict with 'code', 'expires_at', and 'instructions'.
        """
        pass

    @abstractmethod
    def check_status(self, offer_id: str) -> str:
        """
        Checks if the voucher has been redeemed.
        Returns 'PENDING', 'COMPLETED', or 'EXPIRED'.
        """
        pass

    @abstractmethod
    def redeem(self, offer_id: str) -> bool:
        """
        Simulates or executes redemption (if API allows).
        """
        pass

class BaseConnector(ABC):
    @abstractmethod
    def get_quote(self, amount: float, currency_from: str, currency_to: str) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    def execute_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

class ConnectorFactory:
    @staticmethod
    def get_connector(country_code: str) -> BaseConnector:
        # Simplistic factory or registry
        # In a real app complexity is higher.
        # For now returning a dummy matches imports if used.
        return None
