import sys
import os
import uuid

# Add the root directory to sys.path so we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')))

from backend.database import SessionLocal, engine
from backend.models.gateway import InstitutionalGateway

def seed_gateways():
    # Create the table if it doesn't exist
    InstitutionalGateway.__table__.create(engine, checkfirst=True)
    
    db = SessionLocal()
    try:
        # 1. US -> Mexico (Synthetic / Voucher)
        us_mx = db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "US-MX").first()
        if not us_mx:
            db.add(InstitutionalGateway(
                corridor_code="US-MX",
                rail_type="RETAILER_API",
                currency="USD",
                payment_details={
                    "provider": "Reloadly", 
                    "retailer": "Soriana", 
                    "delivery_method": "EMAIL_SMS",
                    "logo_url": "/logos/soriana.png"
                },
                instruction_template="Purchase processed. Your Soriana Code is: {{code}}. Present at checkout.",
                is_active=True
            ))
            print("Added US-MX Gateway")

        # 2. Mexico <-> Guatemala (P2P / Bank)
        mx_gt = db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "MX-GT").first()
        if not mx_gt:
            db.add(InstitutionalGateway(
                corridor_code="MX-GT",
                rail_type="SPEI",
                currency="MXN",
                payment_details={
                    "bank": "STP", 
                    "clabe": "646180000000000000", 
                    "beneficiary": "Symmetri Escrow"
                },
                instruction_template="Transfer MXN via SPEI. Use Concept: {{reference}}. Matching engine active.",
                is_active=True
            ))
            print("Added MX-GT Gateway")

        # 3. US -> Guatemala (Synthetic / Voucher)
        us_gt = db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "US-GT").first()
        if not us_gt:
            db.add(InstitutionalGateway(
                corridor_code="US-GT",
                rail_type="RETAILER_API",
                currency="GTQ",
                payment_details={
                    "provider": "Reloadly", 
                    "retailer": "Super Selectos", 
                    "method": "Digital Code",
                    "logo_url": "/logos/super_selectos.png"
                },
                instruction_template="Transaction Approved. Your Super Selectos Voucher Code is: {{code}}. Valid for groceries only.",
                is_active=True
            ))
            print("Added US-GT Gateway")
        else:
            # Update to include logo_url if missing
            us_gt.payment_details["logo_url"] = "/logos/super_selectos.png"
            us_gt.payment_details["method"] = "Digital Code"
            print("Updated US-GT Gateway details")

        # 4. US -> Dominican Republic (Synthetic / Voucher)
        us_dr = db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "US-DR").first()
        if not us_dr:
            db.add(InstitutionalGateway(
                corridor_code="US-DR",
                rail_type="RETAILER_API",
                currency="DOP",
                payment_details={
                    "provider": "Ding", 
                    "retailer": "Jumbo / CCN", 
                    "method": "Digital Code",
                    "logo_url": "/logos/jumbo_dr.png"
                },
                instruction_template="Ready to redeem. Your CCN/Jumbo Code is: {{code}}. Show this at the cashier.",
                is_active=True
            ))
            print("Added US-DR Gateway")
        else:
            # Update to include logo_url if missing
            us_dr.payment_details["logo_url"] = "/logos/jumbo_dr.png"
            us_dr.payment_details["method"] = "Digital Code"
            print("Updated US-DR Gateway details")

        db.commit()
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_gateways()
