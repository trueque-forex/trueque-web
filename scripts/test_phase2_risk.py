import sys
import os
import uuid
from decimal import Decimal

# Add parent dir to path so backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine, Base
from backend.models.offer_model import Offer
from backend.services.market_depth_service import MarketDepthService
from backend.controllers.payment_controller import PaymentController

def run_risk_tests():
    print("Executing Phase 2 Risk Management & Ledger Separation Test...")
    
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    depth_service = MarketDepthService()
    controller = PaymentController()
    
    try:
        # Clear existing open MXN offers for a clean environment
        db.query(Offer).filter(Offer.currency_offered == "MXN").delete()
        db.commit()
        
        dummy_user_id = uuid.uuid4()
        
        # We need a Business order that hits a gap.
        # Target: $10,400.00 USD (208,000 MXN)
        # Offer 1: $10,000.00 USD (200,000 MXN)
        # Gap: $400.00
        
        offer = Offer(
            user_id=dummy_user_id,
            amount_offered=Decimal('200000.00'),
            currency_offered='MXN',
            amount_wanted=Decimal('10000.00'),
            currency_wanted='USD',
            exchange_rate=Decimal('0.05'),
            status="open"
        )
        db.add(offer)
        db.commit()
        
        print("✅ Added single P2P Matcher of 200,000 MXN ($10,000 USD)")
        
        target_usd_principal = Decimal('10400.00')
        
        # --- TEST 1: VELOCITY REJECTION ---
        print("\n--- TEST 1: VELOCITY REJECTION ---")
        # Artificially pump the daily tracker to simulate Symmetri being near its $10k internal corporate limit.
        MarketDepthService.current_daily_treasury_spend = Decimal('9800.00')
        print(f"Daily Spend mocked to: ${MarketDepthService.current_daily_treasury_spend:,.2f}")
        
        print(f"📡 Executing Matrix Match: ${target_usd_principal:,.2f}")
        
        match_result_fail = depth_service.get_aggregated_match(target_usd_principal)
        
        # It must reject the treasury since 9800 + 400 = 10200 > 10000
        assert match_result_fail["status"] == "PARTIAL", f"Expected PARTIAL fallback, got {match_result_fail.get('status')}"
        assert "Market maxed out or safety limits engaged" in match_result_fail["message"], "Wrong fallback message"
        assert match_result_fail["adjusted_principal_usd"] == 10000.00, "Did not fallback to purely available P2P."
        
        print(f"✅ RISK PASSED: Treasury safely blocked. Requested gap ($400) would breach $10,000 daily maximum. Adjusted Prompt sent.")
        
        
        # --- TEST 2: LEDGER WALL SEGREGATION ---
        print("\n--- TEST 2: LEDGER WALL SEGREGATION ---")
        MarketDepthService.current_daily_treasury_spend = Decimal('0.00') # Reset for clean run
        
        match_result_success = depth_service.get_aggregated_match(target_usd_principal)
        
        assert match_result_success["status"] == "FILLED", f"Expected FILLED, got {match_result_success.get('status')}"
        assert match_result_success["is_treasury_active"] == True, "Treasury Node failed to activate."
        
        quote = controller.get_authorization_quote(
            principal=target_usd_principal,
            currency_from='USD',
            currency_to='MXN',
            mid_market_rate=Decimal('20.00'),
            payment_method='RTP'
        )
        
        payout_res = controller.trigger_payout(
            transaction_id="business_tx_9999",
            quote_details=quote,
            match_result=match_result_success
        )
        
        funding = payout_res.get("funding_ledger_split")
        assert funding is not None, "Ledger Split missing from payout response."
        assert funding.get("FBO_ACCOUNT") == 10000.00, f"Expected FBO $10000.00, got {funding.get('FBO_ACCOUNT')}"
        assert funding.get("CORPORATE_ACCOUNT") == 400.00, f"Expected CORP $400.00, got {funding.get('CORPORATE_ACCOUNT')}"
        
        print(f"✅ LEDGER PASSED: Split unified payout generated perfectly:")
        print(f"   FBO_ACCOUNT:       ${funding.get('FBO_ACCOUNT'):,.2f}")
        print(f"   CORPORATE_ACCOUNT: ${funding.get('CORPORATE_ACCOUNT'):,.2f}")
        print("   Unified MTL Reference: " + payout_res.get("payout_reference"))

        print("\n" + "="*50)
        print("🎉 RISK MANAGEMENT & LEDGER WALL FULLY GREEN")
        print("="*50)

    except Exception as e:
        print("❌ Risk engine test failed:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_risk_tests()
