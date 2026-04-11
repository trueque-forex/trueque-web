
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

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print(f"Checking DB: {DATABASE_URL.split('@')[-1]}") # hide credentials
        
        # Check specific to postgres
        try:
             result = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'kyc_status'"))
             row = result.fetchone()
             if row:
                 print(f"✅ VERIFIED: Column 'kyc_status' exists. Type: {row[1]}")
             else:
                 print("❌ VERIFICATION FAILED: Column not found in information_schema.")
        except Exception as ex:
             # Fallback for SQLite (Pragma)
             print(f"⚠️ Postgres query failed, trying SQLite: {ex}")
             try:
                res = conn.execute(text("PRAGMA table_info(users)"))
                found = False
                for r in res:
                    if r[1] == 'kyc_status':
                        found = True
                        print(f"✅ VERIFIED (SQLite): Column 'kyc_status' exists.")
                        break
                if not found:
                     print("❌ VERIFICATION FAILED (SQLite): Column not found.")
             except:
                pass


except Exception as e:
    print(f"❌ Critical Error: {e}")
