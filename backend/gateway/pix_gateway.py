# backend/gateway/pix_gateway.py

from backend.gateway.gateway import PaymentGateway

class PIXGateway(PaymentGateway):
    def confirm_payment(self, tx_id: str) -> str:
        """
        Simulate confirmation of a PIX payment.
        In production, this would query the bank or listen for webhook.
        """
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Simulate sending a payout via PIX.
        """
        pix_key = recipient.get("pix_key")
        return f"pix_tx_{pix_key}_{currency}"

    def supports_instant_payout(self) -> bool:
        return True