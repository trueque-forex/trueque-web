# backend/gateway/spei_gateway.py

import os
from backend.gateway.gateway import PaymentGateway

class SPEIGateway(PaymentGateway):
    def _check_mock_mode(self):
        if os.getenv('PAYMENT_MOCK_MODE') == 'true':
            print("⚠️ WARNING: SIMULATING SPEI PAYMENT (Sandbox Mode)")
            return True
        else:
            raise Exception("🚨 FATAL: SPEI Gateway keys not configured. Transaction aborted.")

    def confirm_payment(self, tx_id: str) -> str:
        """
        Simulate confirmation of a SPEI payment.
        """
        self._check_mock_mode()
        return "confirmed"

    def send_payout(self, recipient: dict, amount: float, currency: str) -> str:
        """
        Simulate sending a payout via SPEI.
        """
        self._check_mock_mode()
        clabe = recipient.get("clabe")
        bank_code = recipient.get("bank_code")
        return f"spei_tx_{clabe}_{bank_code}"

    def supports_instant_payout(self) -> bool:
        try:
            return self._check_mock_mode()
        except Exception:
            return False