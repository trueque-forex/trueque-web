
import os
import uuid
import bcrypt
import time
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

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found!")
    exit(1)

def create_sofia():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        ts = int(time.time())
        email = f"sofia.tester.{ts}@example.com"
        password = "Symmetri123!"
        
        # Hash Password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        # IDs
        uid = str(uuid.uuid4())
        tid = f"T2026ES_SOFIA_{ts}" 
        
        print(f"Creating {email} with TID {tid}...")
        
        conn.execute(text("""
            INSERT INTO users (
                id,
                email, 
                email_canonical,
                username,
                username_canonical,
                password_hash, 
                first_name, 
                last_name, 
                tid, 
                kyc_status, 
                country_of_residence,
                created_at,
                is_test
            )
            VALUES (
                :uid,
                :email, 
                :email,
                :email,
                :email,
                :pwd, 
                'Sofia', 
                'Tester', 
                :tid, 
                'APPROVED', 
                'ES',
                now(),
                true
            )
        """), {
            "uid": uid,
            "email": email,
            "pwd": hashed,
            "tid": tid
        })
        conn.commit()
        print("✅ User Sofia Created Successfully")

if __name__ == "__main__":
    try:
        create_sofia()
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        if hasattr(e, 'orig'):
             print(f"DB Error: {e.orig}")
        import traceback
        traceback.print_exc()
