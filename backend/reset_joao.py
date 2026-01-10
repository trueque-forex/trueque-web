
import sys
import os
from sqlalchemy import create_engine, text

# Load Env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key] = val

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./trueque.db")
print(f"Connecting to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        print("🔍 Searching for Joao...")
        # 1. Get User ID
        result = conn.execute(text("SELECT id, kyc_status FROM users WHERE email = 'joao.teste@trueque.dev'"))
        row = result.fetchone()
        
        if not row:
            print("❌ User not found!")
            sys.exit(0)
        
        user_id = row[0]
        current_status = row[1]
        print(f"✅ User found: {user_id} (Status: {current_status})")
        
        # 2. Update Users table
        conn.execute(text("UPDATE users SET kyc_status = 'none' WHERE id = :uid"), {"uid": user_id})
        print("✅ Updated users.kyc_status to 'none'")
        
        # 3. Update user_kyc_status table
        # Check if table exists to be safe, or just try/except the execution
        try:
             with conn.begin_nested():
                 conn.execute(text("UPDATE user_kyc_status SET kyc_status = 'none' WHERE user_id = :uid"), {"uid": user_id})
                 print("✅ Updated user_kyc_status.kyc_status to 'none'")
        except Exception as e:
             print(f"⚠️ Could not update user_kyc_status (ignoring): {e}")

        # 4. Delete transactions
        # transactions.user_id is TEXT per schema inspection
        print("🗑️ Deleting transactions...")
        result_tx = conn.execute(text("DELETE FROM transactions WHERE user_id = :uid_str AND timestamp >= CURRENT_DATE"), {"uid_str": str(user_id)})
        print(f"✅ Deleted {result_tx.rowcount} transactions.")
        
    print("🎉 Reset Complete for Director Testing!")

except Exception as e:
    print(f"❌ Critical Error: {e}")
    import traceback
    traceback.print_exc()
