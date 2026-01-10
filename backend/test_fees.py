import sys
import os

# Ensure backend module is importable
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from backend.services.fee_orchestrator import FeeOrchestrator

def test_fee_logic():
    orchestrator = FeeOrchestrator()
    
    amount_send = 1000.00
    rate = 1200.00 # Example USD -> ARS
    
    print("--- SCENARIO 1: BANK TRANSFER (RTP) ---")
    quote_rtp = orchestrator.get_transparent_quote(
        amount_send=amount_send,
        currency_from='USD',
        currency_to='ARS',
        mid_market_rate=rate,
        payment_method='bank_transfer',
        trueque_id='T20251226US0001X'
    )
    
    bd_rtp = quote_rtp['breakdown']
    net_rtp = quote_rtp['net_payout_amount']
    print(f"Inbound Fee: {bd_rtp['inbound_fee']}")
    print(f"Liquidity Fee: {bd_rtp['liquidity_fee']}")
    print(f"Total Friction: {bd_rtp['total_friction']}")
    print(f"Net Payout (ARS): {net_rtp}")
    
    # Assertions for RTP
    assert bd_rtp['inbound_fee'] == 0.0, "RTP Inbound should be 0"
    assert bd_rtp['liquidity_fee'] == 0.0, "RTP Liquidity should be 0"
    print("\n--- SCENARIO 2: CARD PUSH -> SPAIN (Config Check) ---")
    # Config for ES card_push is 1.2% (0.012)
    # Payment Method Card (Inbound) is 2.9% + 0.30 (US Default)
    quote_es = orchestrator.get_transparent_quote(
        amount_send=1000.0,
        currency_from='USD',
        currency_to='EUR',
        mid_market_rate=0.92,
        payment_method='card',
        outbound_method='card_push',
        trueque_id='T20251226US0001X',
        country_to='ES'
    )
    bd_es = quote_es['breakdown']
    out_fee_es = bd_es['gateway_outbound_fee']
    print(f"ES Outbound Fee: {out_fee_es} (Expected ~12.0)")
    
    # Assertions
    assert abs(out_fee_es - 12.0) < 0.1, f"Expected 12.0 for ES Card Push, got {out_fee_es}"

    print("\n--- SCENARIO 3: CARD PUSH -> ARGENTINA (Config Check) ---")
    # Config for AR card_push is 1.8% (0.018)
    quote_ar = orchestrator.get_transparent_quote(
        amount_send=1000.0,
        currency_from='USD',
        currency_to='ARS',
        mid_market_rate=1200.0,
        payment_method='card',
        outbound_method='card_push',
        trueque_id='T20251226US0001X',
        country_to='AR'
    )
    bd_ar = quote_ar['breakdown']
    out_fee_ar = bd_ar['gateway_outbound_fee']
    print(f"AR Outbound Fee: {out_fee_ar} (Expected ~18.0)")
    
    # Assertions
    assert abs(out_fee_ar - 18.0) < 0.1, f"Expected 18.0 for AR Card Push, got {out_fee_ar}"

    print("\n✅ VALIDATION SUCCESS: Orchestrator is correctly Data-Driven by corridor_config.json")

if __name__ == "__main__":
    test_fee_logic()
