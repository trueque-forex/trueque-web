
import os
import bcrypt
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
    print("DATABASE_URL not found")
    exit(1)

engine = create_engine(DATABASE_URL)

email = "antonio.nuevo@example.com"
password = "password123"

# Hash Password (using bcrypt defaults matching .env rounds if possible, or standard)
# .env says MFA_BCRYPT_ROUNDS=12
salt = bcrypt.gensalt(rounds=12)
hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

try:
    with engine.connect() as conn:
        # Check if exists
        res = conn.execute(text("SELECT id FROM users WHERE email=:email"), {"email": email}).fetchone()
        
        if res:
            print(f"User {email} already exists (ID: {res.id}). Updating password...")
            conn.execute(text("UPDATE users SET password_hash=:pwd WHERE id=:id"), {"pwd": hashed, "id": res.id})
            conn.commit()
            print("Password updated.")
        else:
            print(f"Creating user {email}...")
            # Using columns found in inspect_db to match current schema
            conn.execute(text("""
                INSERT INTO users (
                    email, 
                    email_canonical, 
                    username, 
                    username_canonical, 
                    password_hash, 
                    first_name, 
                    last_name, 
                    tid, 
                    kyc_status, 
                    is_test,
                    country_of_residence,
                    created_at
                )
                VALUES (
                    :email, 
                    :email, 
                    :email, 
                    :email, 
                    :pwd, 
                    'Antonio', 
                    'Nuevo', 
                    'T2026MX_ANTONIO', 
                    'APPROVED', 
                    true,
                    'MX',
                    now()
                )
            """), {
                "email": email,
                "pwd": hashed
            })
            conn.commit()
            print("User created successfully.")

except Exception as e:
    print(f"Error: {e}")
