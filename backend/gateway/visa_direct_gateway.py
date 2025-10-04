# backend/gateway/visa_direct_gateway.py

from backend.gateway.gateway import PaymentGateway

class VisaDirectGateway(PaymentGateway):
    def confirm_payment(self, tx_id: str) -> str:
        """
        Simulate confirmation of a Visa Direct payment.
        In production, this would query the acquirer or listen for webhook.
        """
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Simulate sending a payout via Visa Direct.
        """
        card_number = recipient.get("card_number")
        expiry = recipient.get("expiry")
        return f"visa_tx_{card_number[-4:]}_{currency}"

    def supports_instant_payout(self) -> bool:
        return True