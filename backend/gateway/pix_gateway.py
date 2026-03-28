# backend/gateway/pix_gateway.py

import os
from backend.gateway.gateway import PaymentGateway

class PIXGateway(PaymentGateway):
    def _check_mock_mode(self):
        if os.getenv('PAYMENT_MOCK_MODE') == 'true':
            print("⚠️ WARNING: SIMULATING PIX PAYMENT (Sandbox Mode)")
            return True
        else:
            raise Exception("🚨 FATAL: PIX Gateway keys not configured. Transaction aborted.")

    def confirm_payment(self, tx_id: str) -> str:
        """
        Simulate confirmation of a PIX payment.
        """
        self._check_mock_mode()
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Simulate sending a payout via PIX.
        """
        self._check_mock_mode()
        pix_key = recipient.get("pix_key")
        return f"pix_tx_{pix_key}_{currency}"

    def supports_instant_payout(self) -> bool:
        try:
            return self._check_mock_mode()
        except Exception:
            return False