# backend/gateway/spei_gateway.py

from backend.gateway.gateway import PaymentGateway

class SPEIGateway(PaymentGateway):
    def confirm_payment(self, tx_id: str) -> str:
        """
        Simulate confirmation of a SPEI payment.
        In production, this would query Banco de México or listen for webhook.
        """
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Simulate sending a payout via SPEI.
        """
        clabe = recipient.get("clabe")
        bank_code = recipient.get("bank_code")
        return f"spei_tx_{clabe}_{bank_code}"

    def supports_instant_payout(self) -> bool:
        return True