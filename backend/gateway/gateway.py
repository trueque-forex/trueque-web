# backend/gateway/gateway.py

from abc import ABC, abstractmethod
from typing import Literal

PaymentStatus = Literal["pending", "confirmed", "failed"]

class PaymentGateway(ABC):
    @abstractmethod
    def confirm_payment(self, tx_id: str) -> PaymentStatus:
        """
        Check if the payment with tx_id has been confirmed by the local gateway.
        """
        pass

    @abstractmethod
    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Trigger payout to the recipient using local gateway.
        Returns a payout reference ID.
        """
        pass