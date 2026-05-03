import sys
import os

# Add parent dir to path so backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from decimal import Decimal
from backend.controllers.payment_controller import PaymentController
from backend.database import SessionLocal, engine, Base
from backend.models.models import users
from backend.models.offer_model import Offer
from backend.models.user_model import User
import uuid

def run_e2e_check():
    print("Running final E2E check...")
    Base.metadata.create_all(bind=engine)
    
    # 1. Quote Check
    controller = PaymentController()
    quote = controller.get_authorization_quote(
        amount_send=Decimal('1000.0'),
        currency_from='USD',
        currency_to='MXN',
        mid_market_rate=Decimal('20.0')
    )
    
    assert quote['symmetri_fee_amount'] == 15.0, f"Fee mismatch: {quote['symmetri_fee_amount']}"
    assert quote['target_payout_amount'] == 19700.0, f"Payout mismatch: {quote['target_payout_amount']}"
    
    print("✅ Quote Logic Verified (Fee: 15.0, Payout: 19700.0)")
    
    # 2. Model Persistence Check
    db = SessionLocal()
    try:
        # Create user
        test_user_id = uuid.uuid4()
        test_user = User(
            id=test_user_id,
            trueque_id="E2EGENERIC999",
            email="e2e_user@example.com",
            first_name="Test",
            last_name="User"
        )
        
        db.add(test_user)
        db.flush()
        
        # Create Offer
        test_offer = Offer(
            user_id=test_user_id,
            amount_offered=Decimal('1000.0'),
            currency_offered='USD',
            currency_wanted='MXN',
            amount_wanted=Decimal('19700.0'),
            exchange_rate=Decimal('20.0')
        )
        db.add(test_offer)
        db.flush()
        
        assert test_offer.id is not None, "Offer ID (PG_UUID) was not generated."
        print(f"✅ DB Persistence Verified (User UUID: {test_user.id}, Offer UUID: {test_offer.id})")
        
        print("100% Green. Tests passed.")
        
    except Exception as e:
        print("❌ DB Persistence Failed ORM Mapping:")
        print(e)
        import traceback
        traceback.print_exc()
    finally:
        # 3. Cleanup
        db.rollback()
        db.close()

if __name__ == "__main__":
    run_e2e_check()
