# backend/gateway/mastercard_send_gateway.py

from backend.gateway.gateway import PaymentGateway

class MastercardSendGateway(PaymentGateway):
    def confirm_payment(self, tx_id: str) -> str:
        """
        Simulate confirmation of a Mastercard Send payment.
        In production, this would query the acquirer or listen for webhook.
        """
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Simulate sending a payout via Mastercard Send.
        """
        card_number = recipient.get("card_number")
        expiry = recipient.get("expiry")
        return f"mc_send_tx_{card_number[-4:]}_{currency}"

    def supports_instant_payout(self) -> bool:
        return True