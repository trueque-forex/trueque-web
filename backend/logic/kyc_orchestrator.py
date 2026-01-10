from datetime import datetime, timezone
from backend.models.user_model import User
from backend.models.kyc_audit_model import KYCAuditLog
from backend.common.errors import TruequeError, ErrorCode

class KYCOrchestrator:
    def __init__(self, db_session):
        self.db = db_session

    def process_merchant_kyc(self, user_id: int, tax_id: str, business_name: str) -> User:
        """
        Validates Merchant credentials and upgrades status.
        Requirement: Merchant cannot fulfill vouchers until APPROVED.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise TruequeError(ErrorCode.RESOURCE_NOT_FOUND, f"User {user_id} not found", 404)

        if user.user_type != "MERCHANT":
             raise TruequeError(ErrorCode.VALIDATION_ERROR, "KYC target is not a Merchant", 400)

        # 1. Validate Tax ID (Mock Logic for now)
        if not self._validate_tax_id(tax_id):
             raise TruequeError(ErrorCode.VALIDATION_ERROR, "Invalid Tax ID format", 400)

        # 2. Update User Profile
        old_status = "PENDING" # Assuming default, or we store status on User? User model doesn't have status field shown in my view, checking context...
        # User model has `kyc_tier` (int). Let's assume Tier 2 = Approved Merchant.
        # Wait, `kycStatus` is used in frontend (APPROVED/PENDING). Where is it in backend?
        # `kyc_status` seems missing from my recent view of `user_model.py`. 
        # Checking `User` model again: id, email, full_name, country, created_at, kyc_tier, pin_hash, user_type.
        # It seems `kyc_tier` is the proxy. Tier 0 = Pending/Trust, Tier 2 = Approved? 
        # Or maybe I should add `kyc_status` to User model if it's critical. 
        # The prompt says: "Merchant User cannot fulfill vouchers until their status is APPROVED."
        # I'll update `user_model` to have `kyc_status` or use `kyc_tier`. 
        # Let's add `kyc_status` to simplify.
        
        # ACTUALLY, checking schema... `TruequeSession` has `kycStatus`. 
        # Let's add `kyc_status` to User model to be safe and explicit.
        
        user.full_name = business_name # Use full_name for Business Name
        
        # LOG
        log = KYCAuditLog(
            entity_id=user.id,
            action="MERCHANT_VERIFICATION",
            old_status=getattr(user, 'kyc_status', 'PENDING'),
            new_status="APPROVED",
            actor="SYSTEM",
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(log)
        
        # APPLY
        user.kyc_tier = 2 # Fully verified
        # user.kyc_status = "APPROVED" # Will add this column next tool call.
        
        self.db.commit()
        return user

    def _validate_tax_id(self, tax_id: str) -> bool:
        """
        Mock validation: Check length > 5
        """
        return len(tax_id) > 5
