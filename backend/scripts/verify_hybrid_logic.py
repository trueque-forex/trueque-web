import sys
import os
import uuid
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the root directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.database import Base
from backend.models.offer_model import Offer
from backend.models.gateway import InstitutionalGateway
from backend.routes.trades import get_trade_details

def verify_logic():
    # US-MX and MX-GT require different currencies
    # Let's use an isolated SQLite for verification
    TEST_DB_URL = "sqlite:///./verify_test.db"
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create tables in the isolated DB
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        # Seed Gateways
        db.add(InstitutionalGateway(
            corridor_code="US-MX",
            rail_type="RETAILER_API",
            currency="USD",
            payment_details={"provider": "Reloadly", "retailer": "Soriana", "delivery_method": "EMAIL_SMS"},
            instruction_template="Purchase processed. Your Soriana Code is: {{code}}. Present at checkout.",
            is_active=True
        ))
        db.add(InstitutionalGateway(
            corridor_code="MX-GT",
            rail_type="SPEI",
            currency="MXN",
            payment_details={"bank": "STP", "clabe": "646180000000000000", "beneficiary": "Symmetri Escrow"},
            instruction_template="Transfer MXN via SPEI. Use Concept: {{reference}}. Matching engine active.",
            is_active=True
        ))
        db.add(InstitutionalGateway(
            corridor_code="US-GT",
            rail_type="RETAILER_API",
            currency="GTQ",
            payment_details={"provider": "Reloadly", "retailer": "Super Selectos", "method": "Barcode"},
            instruction_template="Transaction Approved. Your Super Selectos Voucher Code is: {{code}}. Valid for groceries only.",
            is_active=True
        ))
        db.add(InstitutionalGateway(
            corridor_code="US-DR",
            rail_type="RETAILER_API",
            currency="DOP",
            payment_details={"provider": "Ding", "retailer": "Jumbo / CCN", "method": "Digital Code"},
            instruction_template="Ready to redeem. Your CCN/Jumbo Code is: {{code}}. Show this at the cashier.",
            is_active=True
        ))
        db.commit()

        # 1. Test US-MX (Voucher)
        us_mx_id = str(uuid.uuid4())
        db.add(Offer(
            id=us_mx_id,
            user_id="verify-user",
            amount_offered=Decimal("100.00"),
            currency_offered="USD",
            amount_wanted=Decimal("1800.00"),
            currency_wanted="MXN",
            exchange_rate=Decimal("18.00"),
            status="PENDING"
        ))
        
        # 2. Test MX-GT (Bank)
        mx_gt_id = str(uuid.uuid4())
        db.add(Offer(
            id=mx_gt_id,
            user_id="verify-user",
            amount_offered=Decimal("2000.00"),
            currency_offered="MXN",
            amount_wanted=Decimal("110.00"),
            currency_wanted="USD",
            exchange_rate=Decimal("0.055"),
            status="PENDING"
        ))

        # 3. Test US-GT (Voucher)
        us_gt_id = str(uuid.uuid4())
        db.add(Offer(
            id=us_gt_id,
            user_id="verify-user",
            amount_offered=Decimal("100.00"),
            currency_offered="USD",
            amount_wanted=Decimal("780.00"),
            currency_wanted="GTQ",
            exchange_rate=Decimal("7.80"),
            status="PENDING"
        ))

        # 4. Test US-DR (Voucher)
        us_dr_id = str(uuid.uuid4())
        db.add(Offer(
            id=us_dr_id,
            user_id="verify-user",
            amount_offered=Decimal("100.00"),
            currency_offered="USD",
            amount_wanted=Decimal("5600.00"),
            currency_wanted="DOP",
            exchange_rate=Decimal("56.00"),
            status="PENDING"
        ))
        db.commit()

        print("--- Verifying US-MX (Voucher) ---")
        details_us = get_trade_details(id=us_mx_id, db=db)
        print(f"Rail: {details_us['payment_instructions']['rail']}")
        assert details_us['payment_instructions']['rail'] == "RETAILER_API"
        assert "SORIANA-" in details_us['payment_instructions']['voucher_code']

        print("\n--- Verifying MX-GT (Bank) ---")
        details_mx = get_trade_details(id=mx_gt_id, db=db)
        print(f"Rail: {details_mx['payment_instructions']['rail']}")
        assert details_mx['payment_instructions']['rail'] == "SPEI"
        assert details_mx['payment_instructions']['voucher_code'] is None

        print("\n--- Verifying US-GT (Voucher) ---")
        details_gt = get_trade_details(id=us_gt_id, db=db)
        print(f"Rail: {details_gt['payment_instructions']['rail']}")
        print(f"Voucher Code: {details_gt['payment_instructions']['voucher_code']}")
        assert "SUPER SELECTOS-" in details_gt['payment_instructions']['voucher_code']
        assert "Super Selectos Voucher Code" in details_gt['payment_instructions']['step_by_step']

        print("\n--- Verifying US-DR (Voucher) ---")
        details_dr = get_trade_details(id=us_dr_id, db=db)
        print(f"Rail: {details_dr['payment_instructions']['rail']}")
        print(f"Voucher Code: {details_dr['payment_instructions']['voucher_code']}")
        assert "JUMBO / CCN-" in details_dr['payment_instructions']['voucher_code']
        assert "CCN/Jumbo Code" in details_dr['payment_instructions']['step_by_step']

        print("\n✅ Verification Successful!")

    except Exception as e:
        print(f"❌ Verification Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()
        try:
            if os.path.exists("verify_test.db"):
                os.remove("verify_test.db")
        except:
            pass

if __name__ == "__main__":
    verify_logic()
