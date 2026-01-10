
import sys
import os
import json
import uuid

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.settlement_engine import SettlementEngine

def run_simulation():
    engine = SettlementEngine()
    tx_id = f"tx_{uuid.uuid4().hex[:8]}"
    
    print(f"--- Simulating Transaction {tx_id} ---")
    
    # Context from Offer/Quote
    sender_amount_total = 102.00 # Assuming 100 Principal + 2 Friction
    total_friction = 2.00
    expected_principal = 100.00
    mid_market_rate = 1.0 # EUR to EUR for simplicity, or EUR to ARS
    
    # 1. Initiate Settlement (Identity Verification)
    print("\n[Step 1] Verifying Identity (Spain VoP)...")
    res1 = engine.initiate_settlement(
        transaction_id=tx_id,
        sender_country="ES",
        recipient_country="ES", # Testing VoP Logic
        recipient_name="Valid User",
        recipient_identifier="ES1234567890"
    )
    print(json.dumps(res1, indent=2))
    
    if res1["status"] != "PENDING":
        print("Simulation Failed at Step 1")
        return

    # 2. Confirm Inbound (Simulation of Webhook)
    print("\n[Step 2] Receiving Inbound Funds...")
    # Simulate receiving the full amount (Principal + Fees)
    res2 = engine.confirm_inbound(
        transaction_id=tx_id,
        amount_received=sender_amount_total,
        quote_expected_amount=sender_amount_total,
        total_friction=total_friction
    )
    print(json.dumps(res2, indent=2))
    
    if res2["status"] != "AUTHORIZED":
        print("Simulation Failed at Step 2")
        return
        
    # Verify Net Principal (Option B Check)
    if res2["net_principal"] != expected_principal:
        print(f"CRITICAL: Net Principal mismatch! Expected {expected_principal}, got {res2['net_principal']}")
        return

    # 3. Execute Payout
    print("\n[Step 3] Executing Payout...")
    res3 = engine.execute_payout(
        transaction_id=tx_id,
        net_principal=res2["net_principal"],
        mid_market_rate=mid_market_rate
    )
    print(json.dumps(res3, indent=2))
    
    if res3["status"] == "SETTLED":
        print("\nSUCCESS: Transaction Settlement Cycle Completed.")

if __name__ == "__main__":
    run_simulation()
