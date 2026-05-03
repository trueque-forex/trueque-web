
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

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found!")
    exit(1)

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(
        text("SELECT email, tid, country_of_residence, kyc_status FROM users WHERE email LIKE 'antonio%'"),
    ).fetchall()
    
    print(f"Found {len(result)} Antonio(s):")
    for r in result:
        print(f"[{r.email}] TID: {r.tid} | Country: {r.country_of_residence} | Status: {r.kyc_status}")
