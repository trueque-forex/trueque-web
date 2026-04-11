
import sys
import os
import json

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.fee_orchestrator import FeeOrchestrator

def run_simulation():
    orchestrator = FeeOrchestrator()
    amount = 1000.0
    
    print("--- 1. Standard Quote (Debit Card -> ARS) ---")
    # Standard day, no holiday
    os.environ['HOLIDAY_MODE'] = ''
    quote_standard = orchestrator.get_transparent_quote(
        amount_send=amount,
        currency_from="EUR",
        currency_to="ARS",
        mid_market_rate=1150.0,
        country_from="ES",
        country_to="AR",
        payment_method='card', # Implies liquidity fee
        outbound_method='bank_rtp'
    )
    
    print(f"Liquidity Fee (Standard): {quote_standard['breakdown']['liquidity_fee']:.2f}")
    print(f"Total Friction: {quote_standard['breakdown']['total_friction']:.2f}")

    print("\n--- 2. Holiday Mode Test (Debit Card -> ARS) ---")
    # Force Holiday Mode for AR
    os.environ['HOLIDAY_MODE'] = 'AR'
    
    quote_holiday = orchestrator.get_transparent_quote(
        amount_send=amount,
        currency_from="EUR",
        currency_to="ARS",
        mid_market_rate=1150.0,
        country_from="ES",
        country_to="AR",
        payment_method='card',
        outbound_method='bank_rtp'
    )
    
    print(f"Liquidity Fee (Holiday): {quote_holiday['breakdown']['liquidity_fee']:.2f}")
    print(f"Total Friction: {quote_holiday['breakdown']['total_friction']:.2f}")

    # Validation
    std_liq = quote_standard['breakdown']['liquidity_fee']
    hol_liq = quote_holiday['breakdown']['liquidity_fee']
    
    if hol_liq >= (std_liq * 1.9): # Expecting double (~2.0x)
        print("\nSUCCESS: Holiday Logic Verified (Liquidity Fee Doubled).")
    else:
        print(f"\nFAILURE: Holiday Logic Check Failed. {hol_liq} is not double {std_liq}")

if __name__ == "__main__":
    run_simulation()
