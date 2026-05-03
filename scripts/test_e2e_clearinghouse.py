import sys
import os
import uuid
from decimal import Decimal
import asyncio

# Add parent dir to path so backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine, Base
from backend.models.offer_model import Offer
from backend.services.market_depth_service import MarketDepthService
from backend.controllers.payment_controller import PaymentController

def seed_offers(db, usd_amounts):
    dummy_user = uuid.uuid4()
    for amt in usd_amounts:
        offer = Offer(
            user_id=dummy_user,
            amount_offered=Decimal(str(amt)) * Decimal('20.00'), # MXN
            currency_offered='MXN',
            amount_wanted=Decimal(str(amt)),
            currency_wanted='USD',
            exchange_rate=Decimal('0.05'),
            status="open"
        )
        db.add(offer)
    db.commit()

def clear_offers(db):
    db.query(Offer).delete()
    db.commit()

def run_e2e_clearinghouse():
    print("Executing E2E Clearinghouse Simulation...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    depth_service = MarketDepthService()
    controller = PaymentController()
    
    # Track corporate payouts
    total_corporate_payouts = Decimal('0.00')

    try:
        # Initialize
        MarketDepthService.current_daily_treasury_spend = Decimal('0.00')
        print("✅ current_daily_treasury_spend initialized to 0.00")
        
        # --- RETAIL FLOW ---
        print("\n--- 1. RETAIL FLOW ---")
        clear_offers(db)
        seed_offers(db, [400.00, 100.00, 50.00]) # 400 is exact match
        
        match_retail = depth_service.get_aggregated_match(Decimal('400.00'))
        
        assert match_retail["status"] == "FILLED", "Retail order failed."
        assert match_retail["is_treasury_active"] == False, "Treasury executed on Retail!"
        assert len(match_retail["matched_offers"]) == 1, "Expected 1:1 P2P match."
        
        # Check Quote
        quote_retail = controller.get_authorization_quote(
            principal=Decimal('400.00'), currency_from='USD', currency_to='MXN', mid_market_rate=Decimal('20.00')
        )
        # 1.5% of 400 is 6.00
        assert Decimal(str(quote_retail['symmetri_fee_amount'])) == Decimal('6.00'), "Expected 1.5% fee on Retail."
        print("✅ Retail Flow: $400.00 matched exactly 1:1. 1.5% Fee verified. NO Treasury used.")


        # --- BUSINESS EXECUTION FLOW ---
        print("\n--- 2. BUSINESS EXECUTION FLOW ---")
        clear_offers(db)
        # Force P2P to max out at 14,600 using 3 massive matchers (leaves room for Treasury)
        seed_offers(db, [5000.00, 5000.00, 4600.00])
        
        match_business = depth_service.get_aggregated_match(Decimal('15000.00'))
        
        assert match_business["status"] == "FILLED", "Business order failed to fill."
        assert match_business["is_treasury_active"] == True, "Treasury failed to deploy on Business gap."
        assert Decimal(str(match_business["treasury_usd"])) == Decimal('400.00'), f"Treasury filled wrong amount: {match_business['treasury_usd']}"
        assert MarketDepthService.current_daily_treasury_spend == Decimal('400.00'), "Daily Treasury Spend did not update!"
        
        quote_business = controller.get_authorization_quote(
            principal=Decimal('15000.00'), currency_from='USD', currency_to='MXN', mid_market_rate=Decimal('20.00')
        )
        # 1.0% of 15000 is 150.00
        assert Decimal(str(quote_business['symmetri_fee_amount'])) == Decimal('150.00'), "Expected flat 1.0% Business fee on entire volume."
        
        payout_res = controller.trigger_payout(
            transaction_id="tx_biz_1", quote_details=quote_business, match_result=match_business
        )
        corporate_amount = Decimal(str(payout_res['funding_ledger_split'].get('CORPORATE_ACCOUNT', 0)))
        total_corporate_payouts += corporate_amount
        
        print("✅ Business Flow: $15,000 matched. P2P maxed at $14,600. Treasury executed exactly $400. 1.0% fee applied. Tracker updated.")
        
        
        # --- VELOCITY REJECTION FLOW ---
        print("\n--- 3. VELOCITY REJECTION FLOW ---")
        clear_offers(db)
        # Force P2P to max out at $38,000 but user asks for $50,000.
        # Seed 10 offers summing to exactly 38,000
        seed_offers(db, [3800.00] * 10)
        
        match_rejection = depth_service.get_aggregated_match(Decimal('50000.00'))
        
        # Gap is $12,000. The cap is $500. So it WILL reject treasury.
        assert match_rejection["status"] == "PARTIAL", "Velocity flow incorrectly filled!"
        assert match_rejection["adjusted_principal_usd"] == 38000.00, f"Expected fallback Adjuster to recommend $38,000, got {match_rejection['adjusted_principal_usd']}"
        assert match_rejection["treasury_usd"] == 0.0, "Treasury attempted to illegally deploy!"
        
        print("✅ Velocity Rejection Flow: System successfully blocked $12k Treasury gap and gracefully returned Adjuster prompt for 38,000.00.")

        
        # --- LEDGER AUDIT ---
        print("\n--- 4. LEDGER AUDIT ---")
        assert total_corporate_payouts == Decimal('400.00'), f"Final internal ledger mismatch: Expected $400.00 CORPORATE, got {total_corporate_payouts}"
        print("✅ Ledger Audit: Final state confirms exactly $400.00 routed cleanly from CORPORATE_ACCOUNT across all scenarios.")

        print("\n=======================================================")
        print("🎉 E2E CLEARINGHOUSE STATEFUL SIMULATION 100% GREEN")
        print("=======================================================")

    except Exception as e:
        print("❌ E2E Simulation failed:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_e2e_clearinghouse()
