
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

# Force SQLite for specific patch
DATABASE_URL = "sqlite:///./trueque.db" # Forced override for dual-patching
print(f"Connecting to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN kyc_status TEXT DEFAULT 'none'"))
            print("✅ Command executed successfully.")
        except Exception as e:
            if 'duplicate column' in str(e).lower():
                print("ℹ️ Column already exists (ignoring).")
            else:
                raise e
        
        # Verify
        print("🔍 Verifying column existence...")
        # Check specific to postgres
        try:
             result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status'"))
             row = result.fetchone()
             if row:
                 print(f"✅ Verified: Column 'kyc_status' exists with type '{row[1]}'")
             else:
                 print("❌ Verification Failed: Column not found in information_schema.")
        except Exception as ex:
             print(f"⚠️ Verification query failed (might be SQLite?): {ex}")

except Exception as e:
    print(f"❌ Critical Error: {e}")
    import traceback
    traceback.print_exc()
