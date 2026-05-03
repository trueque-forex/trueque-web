
import sys
import os
import uuid
from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models.gateway import InstitutionalGateway

def seed_gateways():
    # Ensure table exists
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Clear existing gateways for ES-CO to avoid duplicates
        db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "ES-CO").delete()
        db.commit()
        
        # 1. Inbound (Spain - Bizum)
        bizum_es = InstitutionalGateway(
            id=uuid.uuid4(),
            corridor_code="ES-CO",
            rail_type="BIZUM",
            currency="EUR",
            payment_details={
                "phone": "+34 600 000 000",
                "merchant_name": "Symmetri Pilot ES",
                "bank": "BBVA"
            },
            instruction_template="Open your Bizum app. Send exact amount to {{phone}}. IMPORTANT: Put code {{reference}} in the concept."
        )

        # 2. Outbound (Colombia - Transfiya)
        transfiya_co = InstitutionalGateway(
            id=uuid.uuid4(),
            corridor_code="ES-CO",
            rail_type="TRANSFIYA",
            currency="COP",
            payment_details={
                "aggregator": "Kushki",
                "method": "Phone Push"
            },
            instruction_template="Funds will be pushed instantly to beneficiary phone via Transfiya."
        )

        db.add(bizum_es)
        db.add(transfiya_co)
        db.commit()
        print("Success: Spain-Colombia Gateways seeded.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding gateways: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_gateways()
