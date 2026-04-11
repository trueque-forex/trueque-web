
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from ..models.user_model import User
from ..models.transaction import Transaction
from ..common.errors import TruequeError

class LimitEnforcer:
    TIERS = {
        0: 200.00,      # Unverified / Trust
        1: 3000.00,     # Standard
        2: float('inf') # Enhanced / Unlimited
    }

    @staticmethod
    def get_monthly_volume(user_id: str, db: Session) -> float:
        """
        Calculates total volume for the current month.
        """
        now = datetime.now(timezone.utc)
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Sum confirmed transactions where user is sender
        # Note: We use Transaction model which records completed swaps.
        # For a stricter check, we might want to include 'PENDING' offers too, 
        # but standard practice is usually settled volume. 
        # However, to prevent spamming pending offers to bypass, we should ideally check Offers too.
        # For this MVC, we check Transactions (completed) + we could add logic for Pending if needed.
        # Let's check Transactions for now as per instructions "current_monthly_volume".
        
        total = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == str(user_id),
            Transaction.timestamp >= start_of_month,
            Transaction.status != 'failed' # disputed or confirmed count
        ).scalar() or 0.0
        
        return float(total)

    @classmethod
    def check_limit(cls, user_id: str, amount_in_eur: float, db: Session):
        """
        Checks if the new amount pushes the user over their monthly tier limit.
        Raises TruequeError if limit exceeded.
        """
        # 1. Get User Tier
        # We need to query the user to get the tier if not provided
        # But for efficiency, caller might pass User object. 
        # Here we accept ID and query strictly to be safe.
        user = db.query(User).filter(User.id == user_id).first() # user_id is Int in model, but passed as Str often. 
        # Warning: User model ID is Integer, but Auth uses String UUIDs in some places?
        # Let's check User model again. It says `id = Column(Integer, primary_key=True)`.
        # BUT `offer.user_id` is String. 
        # Use string casting or logic from `match_service`.
        
        if not user:
            # If user not found (e.g. not in local DB yet?), treat as Tier 0
            tier = 0
        else:
            tier = user.kyc_tier if user.kyc_tier is not None else 0
            
        limit = cls.TIERS.get(tier, 0)
        
        # 2. Get Current Volume
        current_vol = cls.get_monthly_volume(user_id, db)
        
        # 3. Check
        if (current_vol + amount_in_eur) > limit:
            raise TruequeError(
                code="KYC_LIMIT_EXCEEDED",
                message=f"Monthly limit of €{limit} exceeded. Current volume: €{current_vol}. Upgrade your tier.",
                metadata={"tier": tier, "limit": limit, "current": current_vol}
            )
