
import sys
import os
from sqlalchemy import create_engine, inspect

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
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables:", tables)
    
    for table in tables:
        if 'user' in table or 'transaction' in table:
            print(f"\nTable: {table}")
            columns = inspector.get_columns(table)
            for c in columns:
                print(f"  - {c['name']} ({c['type']})")

except Exception as e:
    print(f"Error: {e}")
