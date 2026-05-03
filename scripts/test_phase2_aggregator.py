import sys
import os
import uuid
from decimal import Decimal
import asyncio

# Add parent dir to path so backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine, Base
from backend.models.offer_model import Offer
from backend.models.user_model import User
from backend.services.market_depth_service import MarketDepthService
from backend.controllers.payment_controller import PaymentController

def run_aggregator_test():
    print("Executing Phase 2 Aggregator & Treasury Engine Simulation...")
    
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    depth_service = MarketDepthService()
    controller = PaymentController()
    
    try:
        # Clear existing open MXN offers for a clean environment
        db.query(Offer).filter(Offer.currency_offered == "MXN").delete()
        db.commit()
        
        # We need a dummy user_id
        dummy_user_id = uuid.uuid4()
        
        # Create 8 Offers summing exactly to $12,100 USD (242,000 MXN at 20.00 rate)
        # We make sure they easily clear the $500 Business Anchor Floor (10,000 MXN)
        offer_amounts_mxn = [
            Decimal('100000.00'), # $5000
            Decimal('50000.00'),  # $2500
            Decimal('20000.00'),  # $1000
            Decimal('20000.00'),  # $1000
            Decimal('20000.00'),  # $1000
            Decimal('12000.00'),  # $600
            Decimal('10000.00'),  # $500
            Decimal('10000.00')   # $500
        ]
        
        for amt in offer_amounts_mxn:
            offer = Offer(
                user_id=dummy_user_id,
                amount_offered=amt,
                currency_offered='MXN',
                amount_wanted=amt / Decimal('20.00'),
                currency_wanted='USD',
                exchange_rate=Decimal('0.05'),
                status="open"
            )
            db.add(offer)
        db.commit()
        
        print("✅ Seeded 8 P2P Matchers totaling 242,000 MXN ($12,100 USD).")
        
        target_usd_principal = Decimal('12525.00')
        print(f"📡 Executing Business Payload Match: ${target_usd_principal:,.2f}")
        
        match_result = depth_service.get_aggregated_match(target_usd_principal)
        
        assert match_result["status"] == "FILLED", f"Expected FILLED, got {match_result.get('status')}"
        assert match_result["is_treasury_active"] == True, "Treasury Node failed to activate."
        
        matched_offers = match_result["matched_offers"]
        assert len(matched_offers) == 9, f"Expected 9 matchers (8 P2P + 1 Treasury), got {len(matched_offers)}"
        
        treasury_amt = match_result["treasury_usd"]
        assert treasury_amt == 425.00, f"Expected Treasury to fill exactly $425.00, got {treasury_amt}"
        
        print(f"✅ Aggregator successfully triggered Symmetri Treasury Node for ${treasury_amt:,.2f} gap fill!")
        
        # Check Quote and Fees (Business Tier should execute flat 1% rate)
        quote = controller.get_authorization_quote(
            principal=target_usd_principal,
            currency_from='USD',
            currency_to='MXN',
            mid_market_rate=Decimal('20.00'),
            payment_method='RTP'
        )
        
        # 1.0% on $12,525 = $125.25
        fee_amount = Decimal(str(quote['symmetri_fee_amount']))
        assert fee_amount == Decimal('125.25'), f"Expected flat 1.0% Business fee of $125.25, got {fee_amount}"
        
        print(f"✅ Fee Engine successfully applied Business Tier 1.0% flat margin across Treasury/P2P payload: ${fee_amount:,.2f}")
        
        # Run Payout Verification (MTL Direct Route)
        payout_res = controller.trigger_payout(
            transaction_id="business_tx_9999",
            quote_details=quote
        )
        assert payout_res['gateway'] == "Direct_Bank_SPEI", f"Expected MTL Direct Bank Route, got {payout_res['gateway']}"
        print(f"✅ Direct Bank Routing Triggered: {payout_res['gateway']}")
        
        print("\n" + "="*50)
        print("🎉 MULTI-LAYER LIQUIDITY AGGREGATOR & TREASURY FALLBACK VERIFIED")
        print("="*50)
        
    except Exception as e:
        print("❌ Aggregator Verification Failed:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_aggregator_test()
