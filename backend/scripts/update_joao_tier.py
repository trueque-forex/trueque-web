
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from backend.database import SessionLocal
from backend.models.user_model import User

def update_joao():
    db = SessionLocal()
    try:
        # Find Joao by email (common test email) or similar
        # E.g. joao@trueque.forex or similar. 
        # If not sure, we can update ALL users named "Joao" or update user ID 1.
        user = db.query(User).filter(User.full_name.ilike("%Joao%")).first()
        if not user:
            print("User 'Joao' not found!")
            return
            
        print(f"Found user: {user.full_name} (ID: {user.id})")
        print(f"Current Tier: {user.kyc_tier}")
        
        user.kyc_tier = 2
        user.kyc_status = "APPROVED"
        db.commit()
        
        print(f"Updated Tier to: {user.kyc_tier} (Unlimited)")
        print("Done.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_joao()
