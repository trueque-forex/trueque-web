import sys
import os
import uuid
from decimal import Decimal

# Add parent dir to path so backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine, Base
from backend.models.models import users
from backend.models.offer_model import Offer
from backend.models.user_model import User
from backend.controllers.payment_controller import PaymentController
from backend.services.market_depth_service import MarketDepthService

def run_phase2_adjuster_test():
    print("Executing Phase 2 Adjuster & Dynamic Gateway Tests...")
    
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    controller = PaymentController()
    depth_service = MarketDepthService()
    db = SessionLocal()
    
    try:
        principal = Decimal('1000.00')
        
        # --- CHECK 1 (RTP) ---
        quote_rtp = controller.get_authorization_quote(
            principal=principal,
            currency_from='USD',
            currency_to='MXN',
            mid_market_rate=Decimal('20.00'),
            payment_method='RTP'
        )
        assert quote_rtp['total_to_pay'] == 1016.00, f"RTP total expected 1016.00, got {quote_rtp['total_to_pay']}"
        print("✅ Check 1 (RTP): Total is exactly $1,016.00")
        
        # --- CHECK 2 (CARD) ---
        quote_card = controller.get_authorization_quote(
            principal=principal,
            currency_from='USD',
            currency_to='MXN',
            mid_market_rate=Decimal('20.00'),
            payment_method='CARD'
        )
        assert quote_card['total_to_pay'] == 1040.00, f"CARD total expected 1040.00, got {quote_card['total_to_pay']}"
        print("✅ Check 2 (CARD): Total is exactly $1,040.00")
        
        # --- CHECK 3 (Adjuster) ---
        # First, ensure Graciela and Werner exist or just mock user UUIDs for the offer
        graciela_uuid = uuid.uuid4()
        
        # Seed Graciela's 20,500 MXN Offer
        graciela_offer = Offer(
            user_id=graciela_uuid, # We mock it directly
            amount_offered=Decimal('20500.00'),
            currency_offered='MXN',
            amount_wanted=Decimal('1025.00'),
            currency_wanted='USD',
            exchange_rate=Decimal('0.05'),
            status="open"
        )
        db.add(graciela_offer)
        db.commit()
        db.refresh(graciela_offer)
        
        # Identify nearest match for $1000 USD
        adjuster_result = depth_service.get_nearest_match(principal)
        
        assert adjuster_result is not None, "Adjuster returned None"
        assert adjuster_result['mxn_match_amount'] == 20500.00, f"Expected 20,500 MXN match, got {adjuster_result['mxn_match_amount']}"
        assert adjuster_result['adjusted_principal_usd'] == 1025.00, f"Expected adjusted $1025.00, got {adjuster_result['adjusted_principal_usd']}"
        
        print("✅ Check 3 (Adjuster): Verified Match to 20,500 MXN with Adjusted Principal $1,025.00")
        
        print("\n" + "="*50)
        print("🎉 ALL PHASE 2 ADJUSTER & ORCHESTRATOR LOGIC GREEN")
        print("="*50)
        
    except Exception as e:
        print("❌ Phase 2 Adjustment logic failed:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_phase2_adjuster_test()
