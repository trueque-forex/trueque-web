import sys
import os
import uuid

# Add parent dir to path so backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine, Base
from backend.models.models import users
from backend.models.user_model import User
from backend.models.internal_wallet_model import InternalWallet
from backend.models.user_kyc import UserKYC

def seed_test_user():
    print("Seeding permanent test user...")
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        fixed_uuid = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
        
        # Check if user already exists
        existing_user = db.query(User).filter(User.id == fixed_uuid).first()
        if existing_user:
            print(f"User {fixed_uuid} already exists. Removing to re-seed...")
            db.query(InternalWallet).filter(InternalWallet.user_id == fixed_uuid).delete()
            db.query(UserKYC).filter(UserKYC.user_id == fixed_uuid).delete()
            db.delete(existing_user)
            db.commit()
            
        print("Creating User...")
        test_user = User(
            id=fixed_uuid,
            trueque_id="SYMMETRI_WERNER_01",
            email="werner@symmetri.app",
            first_name="Werner",
            last_name="Test",
            kyc_status="KYC_VERIFIED"
        )
        db.add(test_user)
        db.flush()
        
        print("Creating User KYC record...")
        test_kyc = UserKYC(
            user_id=fixed_uuid,
            trueque_id="SYMMETRI_WERNER_01",
            kyc_status="approved",
            kyc_level=2,
            full_legal_name="Werner Test",
            country="US"
        )
        db.add(test_kyc)
        
        print("Creating Internal Wallet with $5,000.00 USD...")
        test_wallet = InternalWallet(
            user_id=fixed_uuid,
            currency="USD",
            balance=5000.00
        )
        db.add(test_wallet)
        
        db.commit()
        print("✅ Seed complete! You can use UUID: 550e8400-e29b-41d4-a716-446655440000 in your frontend tests.")
        
    except Exception as e:
        db.rollback()
        print("❌ Failed to seed user:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_test_user()
