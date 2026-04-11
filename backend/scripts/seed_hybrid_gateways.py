import sys
import os
import uuid

# Add the root directory to sys.path so we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.database import SessionLocal, engine
from backend.models.gateway import InstitutionalGateway

def seed_gateways():
    # Create the table if it doesn't exist
    InstitutionalGateway.__table__.create(engine, checkfirst=True)
    
    db = SessionLocal()
    try:
        # 1. US -> Mexico (Synthetic / Voucher)
        us_mx_gateway = db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "US-MX").first()
        if not us_mx_gateway:
            us_mx_gateway = InstitutionalGateway(
                corridor_code="US-MX",
                rail_type="RETAILER_API",
                currency="USD",
                payment_details={
                    "provider": "Reloadly", 
                    "retailer": "Soriana", 
                    "delivery_method": "EMAIL_SMS"
                },
                instruction_template="Purchase processed. Your Soriana Code is: {{code}}. Present at checkout.",
                is_active=True
            )
            db.add(us_mx_gateway)
            print("Added US-MX Retailer Gateway")
        else:
            print("US-MX Gateway already exists")

        # 2. Mexico <-> Guatemala (P2P / Bank)
        mx_gt_gateway = db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "MX-GT").first()
        if not mx_gt_gateway:
            mx_gt_gateway = InstitutionalGateway(
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
            )
            db.add(mx_gt_gateway)
            print("Added MX-GT SPEI Gateway")
        else:
            print("MX-GT Gateway already exists")

        # 3. US -> Guatemala (Synthetic / Voucher)
        us_gt_gateway = db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "US-GT").first()
        if not us_gt_gateway:
            us_gt_gateway = InstitutionalGateway(
                corridor_code="US-GT",
                rail_type="RETAILER_API",
                currency="GTQ",
                payment_details={
                    "provider": "Reloadly", 
                    "retailer": "Super Selectos", 
                    "method": "Barcode"
                },
                instruction_template="Transaction Approved. Your Super Selectos Voucher Code is: {{code}}. Valid for groceries only.",
                is_active=True
            )
            db.add(us_gt_gateway)
            print("Added US-GT Retailer Gateway")
        else:
            print("US-GT Gateway already exists")

        # 4. US -> Dominican Republic (Synthetic / Voucher)
        us_dr_gateway = db.query(InstitutionalGateway).filter(InstitutionalGateway.corridor_code == "US-DR").first()
        if not us_dr_gateway:
            us_dr_gateway = InstitutionalGateway(
                corridor_code="US-DR",
                rail_type="RETAILER_API",
                currency="DOP",
                payment_details={
                    "provider": "Ding", 
                    "retailer": "Jumbo / CCN", 
                    "method": "Digital Code"
                },
                instruction_template="Ready to redeem. Your CCN/Jumbo Code is: {{code}}. Show this at the cashier.",
                is_active=True
            )
            db.add(us_dr_gateway)
            print("Added US-DR Retailer Gateway")
        else:
            print("US-DR Gateway already exists")

        db.commit()
    except Exception as e:
        print(f"Error seeding gateways: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_gateways()
