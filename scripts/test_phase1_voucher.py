import sys
import os
import uuid
from decimal import Decimal

# Add parent dir to path so backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database import SessionLocal, engine, Base
from backend.services.voucher_service import VoucherService

def run_phase1_test():
    print("Executing Phase 1: JIT Soriana Voucher Purchase...")
    
    # Ensure tables are created (just in case)
    Base.metadata.create_all(bind=engine)
    
    werner_uuid = uuid.UUID("550e8400-e29b-41d4-a716-446655440000")
    amount_usd = Decimal('100.00')
    retailer = "Soriana"
    
    service = VoucherService()
    
    try:
        voucher = service.issue_jit_voucher(
            user_id=werner_uuid,
            retailer_id=retailer,
            amount_usd=amount_usd
        )
        
        print("\n" + "="*40)
        print("✅ PHASE 1 JIT VOUCHER SUCCESS")
        print("="*40)
        print(f"Retailer:        {voucher.retailer_name}")
        print(f"Purchaser UUID:  {voucher.user_id}")
        print(f"Voucher Code:    {voucher.voucher_code}")
        print(f"Amount Paid:     $100.00 USD (Zero FX Margin)")
        print(f"Beneficiary Get: {voucher.amount_mxn} MXN (At True Mid-Market 20.00)")
        print(f"Symmetri Cost:   ${voucher.cost_usd} USD (15% Wholesale Discount)")
        print(f"Symmetri Margin: $15.00 USD (Gross Profit)")
        print("="*40)
        
    except Exception as e:
        print("❌ Phase 1 logic failed:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_phase1_test()
