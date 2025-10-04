# backend/gateway/mock_gateway.py

from backend.gateway.gateway import PaymentGateway

class MockGateway(PaymentGateway):
    def confirm_payment(self, tx_id: str) -> str:
        # Simulate confirmation logic
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        # Simulate payout logic
        return f"mock_payout_{recipient['account']}_{currency}"