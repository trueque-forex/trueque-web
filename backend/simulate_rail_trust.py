
import sys
import os
import time
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models.transaction import Transaction
from backend.models.offer_model import Offer
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv(".env.local")

def simulate_verification(trade_id: str):
    db = SessionLocal()
    print(f"\n--- SYMMETRI TRUST ENGINE SIMULATION ---")
    print(f"Analyzing Trade ID: {trade_id}")
    
    try:
        # Check Transactions
        tx = db.query(Transaction).filter(Transaction.id == trade_id).first()
        if tx:
            print(f"✅ Found Transaction. Status: {tx.status}")
            tx.status = 'COMPLETED'
            tx.inbound_verified = True
            db.commit()
            print("Successfully updated to COMPLETED.")
            return

        # Check Offers
        offer = db.query(Offer).filter(Offer.id == trade_id).first()
        if offer:
            print(f"✅ Found Offer. Status: {offer.status}")
            offer.status = 'COMPLETED'
            db.commit()
            print("Successfully updated to COMPLETED.")
            return

        print(f"❌ ERROR: Trade ID {trade_id} not found.")
        print("Recent Offers in DB:")
        recent = db.query(Offer).order_by(Offer.created_at.desc()).limit(3).all()
        for r in recent:
            print(f" - {r.id} ({r.status})")

    except Exception as e:
        print(f"❌ SYSTEM ERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python simulate_rail_trust.py <TRADE_ID>")
    else:
        simulate_verification(sys.argv[1])
