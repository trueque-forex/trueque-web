from backend.gateway.mock_gateway import MockGateway

gateway_a = MockGateway()
gateway_b = MockGateway()

def settle_dual_payment(tx_id_a, tx_id_b, recipient_a, recipient_b, amount_a, amount_b, currency_a, currency_b):
    if gateway_a.confirm_payment(tx_id_a) == "confirmed" and gateway_b.confirm_payment(tx_id_b) == "confirmed":
        payout_id_a = gateway_b.send_payout(recipient_a, amount_b, currency_b)
        payout_id_b = gateway_a.send_payout(recipient_b, amount_a, currency_a)
        return {"payout_a": payout_id_a, "payout_b": payout_id_b}
    else:
        raise Exception("Payment confirmation failed")