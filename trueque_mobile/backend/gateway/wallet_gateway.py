# backend/gateway/wallet_gateway.py

from backend.gateway.gateway import PaymentGateway

class WalletGateway(PaymentGateway):
    def confirm_payment(self, tx_id: str) -> str:
        """
        Simulate confirmation of a wallet payment.
        In production, this would query the wallet provider or listen for webhook.
        """
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Simulate sending a payout to a digital wallet.
        """
        wallet_id = recipient.get("wallet_id")
        provider = recipient.get("provider")  # e.g., "mercado_pago", "paypal", "modo"
        return f"wallet_tx_{provider}_{wallet_id}"

    def supports_instant_payout(self) -> bool:
        """
        Only return True if the wallet provider guarantees instant availability.
        """
        instant_providers = ["mercado_pago", "modo", "paypal"]
        return recipient.get("provider") in instant_providers