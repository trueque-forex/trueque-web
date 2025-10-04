# backend/gateway/fednow_gateway.py

from backend.gateway.gateway import PaymentGateway

class FedNowGateway(PaymentGateway):
    def confirm_payment(self, tx_id: str) -> str:
        """
        Simulate confirmation of a FedNow payment.
        In production, this would call the bank's FedNow API or webhook.
        """
        # Mock logic: assume all tx_ids are confirmed
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Simulate sending a payout via FedNow.
        In production, this would trigger a real-time bank transfer.
        """
        account = recipient.get("account")
        routing = recipient.get("routing")
        return f"fednow_tx_{account}_{routing}"

    def supports_instant_payout(self) -> bool:
        return True