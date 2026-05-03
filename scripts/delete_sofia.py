
import os
from sqlalchemy import create_engine, text

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key] = val

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Deleting potential Sofia users...")
    conn.execute(text("DELETE FROM users WHERE email LIKE 'sofia.tester%'"))
    conn.commit()
    print("Cleanup Complete")
