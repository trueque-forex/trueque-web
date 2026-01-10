
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import DATABASE_URL

def investigate_history():
    engine = create_engine(DATABASE_URL)
    SessionLimit = sessionmaker(bind=engine)
    session = SessionLimit()
    
    print("--- 1. Querying ALL Offers ---")
    try:
        result = session.execute(text("SELECT * FROM offers LIMIT 5"))
        rows = result.fetchall()
        if not rows:
             print("No offers found in DB.")
        for row in rows:
            print(row)
            
    except Exception as e:
        print(f"Error querying offers: {e}")

    print("\n--- 2. Checking for 'Joao' specifically ---")
    try:
        result = session.execute(text("SELECT DISTINCT uuid FROM offers"))
        uuids = result.fetchall()
        print("Distinct UUIDs in Offers table:", uuids)
    except Exception as e:
         print(f"Error querying distinct UUIDs: {e}")

    print("\n--- 3. Testing INSERT capability ---")
    try:
        # Insert a test offer
        import uuid
        test_uuid = f"TEST-{uuid.uuid4()}"
        session.execute(text(
            "INSERT INTO offers (user_id, uuid, country, currency_from, currency_to, amount_from, amount_to, amount, market_rate, status, timestamp) "
            "VALUES (1, :uuid, 'ES', 'EUR', 'ARS', 100, 100, 100, 1.0, 'pending', NOW())"
        ), {"uuid": test_uuid})
        session.commit()
        print(f"Successfully inserted test offer with UUID: {test_uuid}")
        
        # Verify
        res = session.execute(text("SELECT * FROM offers WHERE uuid = :uuid"), {"uuid": test_uuid})
        print("Retrieved inserted offer:", res.fetchone())
    except Exception as e:
        session.rollback()
        print(f"INSERT Failed: {e}")

if __name__ == "__main__":
    investigate_history()
