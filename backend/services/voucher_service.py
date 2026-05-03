import uuid
from decimal import Decimal
from datetime import datetime
from backend.database import SessionLocal
from backend.models.voucher_model import Voucher

class VoucherService:
    def __init__(self):
        # We assume a fixed mock mid-market rate for Phase 1 test.
        # In production this queries the DailyRate service.
        self.mock_mid_market_rate = Decimal('20.00')

    def issue_jit_voucher(self, user_id: str, retailer_id: str, amount_usd: Decimal) -> Voucher:
        """
        Phase 1: Just-In-Time (JIT) Voucher Issuance
        No P2P matching required. User buys retail credit instantly.
        """
        db = SessionLocal()
        try:
            # 1. Calculate MXN Value at MID-MARKET (NO FEE applied to user!)
            # This is Symmetri's growth hack: absolute zero fee for the user.
            amount_mxn = amount_usd * self.mock_mid_market_rate

            # 2. Calculate Symmetri's 15% discounted backend cost
            # Retailer sells us the $100 value for $85.
            symmetri_cost_usd = amount_usd * Decimal('0.85')

            # 3. Generate a mock API response from Wholesaler
            # In production, this hits an external gift-card API (e.g. Ding, Reloadly)
            mock_api_code = f"VCHR-{retailer_id[:3].upper()}-{str(uuid.uuid4())[:8].upper()}"

            # 4. Save to Database
            voucher = Voucher(
                user_id=user_id,
                retailer_name=retailer_id,
                voucher_code=mock_api_code,
                amount_mxn=amount_mxn,
                cost_usd=symmetri_cost_usd,
                status="active"
            )

            db.add(voucher)
            db.commit()
            db.refresh(voucher)
            
            return voucher
            
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
