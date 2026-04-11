
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

def debug_db():
    load_dotenv(".env.local")
    db_url = os.environ.get("DATABASE_URL")
    print(f"DEBUG: Using DATABASE_URL={db_url[:20]}...")
    
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("\n--- OFFERS TABLE ---")
        try:
            res = conn.execute(text("SELECT * FROM offers ORDER BY created_at DESC LIMIT 3"))
            print(f"Columns: {res.keys()}")
            rows = res.fetchall()
            for r in rows:
                print(f"ID: {r.id} | Status: {r.status} | From: {r.currency_offered}")
        except Exception as e:
            print(f"Error reading offers: {e}")

        print("\n--- TRANSACTIONS TABLE ---")
        try:
            res = conn.execute(text("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 3"))
            print(f"Columns: {res.keys()}")
            rows = res.fetchall()
            for r in rows:
                # Use getattr or index if named columns fail
                print(f"ID: {r.id} | Status: {r.status} | Owner: {r.owner_id}")
        except Exception as e:
            print(f"Error reading transactions: {e}")

if __name__ == "__main__":
    debug_db()
