import os
from backend.gateway.gateway_registry import GatewayRegistry, Recipient


def settle_dual_payment(
    tx_id_a: str,
    tx_id_b: str,
    recipient_a: dict,
    recipient_b: dict,
    amount_a: float,
    amount_b: float,
    currency_a: str,
    currency_b: str,
) -> dict:
    """
    Executes the dual-leg settlement for a P2P currency swap.

    Both legs must confirm before payouts are dispatched.
    Uses GatewayRegistry to select the correct payment rail per recipient.
    Payment behaviour is controlled by PAYMENT_MOCK_MODE in .env:
      - PAYMENT_MOCK_MODE=true  → Sandbox mode (no real money moves)
      - PAYMENT_MOCK_MODE=false → Live mode (real rails)
    """
    mock_mode = os.getenv("PAYMENT_MOCK_MODE", "true").lower() == "true"

    if mock_mode:
        # Sandbox: simulate confirmation without hitting real rails
        confirmed_a = True
        confirmed_b = True
    else:
        # Production: confirm via real gateway webhooks / polling
        # TODO: Replace with real webhook confirmation lookup from DB
        raise NotImplementedError(
            "Live payment confirmation is not yet implemented. "
            "Set PAYMENT_MOCK_MODE=true for sandbox testing."
        )

    if not (confirmed_a and confirmed_b):
        raise Exception("Payment confirmation failed — both legs must be confirmed before payout.")

    # Build typed Recipient objects for GatewayRegistry
    rec_a = Recipient(**recipient_a)
    rec_b = Recipient(**recipient_b)

    gateway_a = GatewayRegistry.select_gateway(rec_a)
    gateway_b = GatewayRegistry.select_gateway(rec_b)

    payout_id_a = gateway_a.send_payout(rec_a)
    payout_id_b = gateway_b.send_payout(rec_b)

    return {
        "payout_a": payout_id_a,
        "payout_b": payout_id_b,
        "gateway_a": gateway_a.name,
        "gateway_b": gateway_b.name,
        "sandbox": mock_mode,
    }