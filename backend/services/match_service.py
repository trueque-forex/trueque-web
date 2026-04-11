import json
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from decimal import Decimal
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.common.errors import TruequeError, ErrorCode
from backend.models.transaction import Transaction
from backend.models.internal_wallet_model import InternalWallet
from backend.models.user_model import User

# Helper to load config (should be in a singleton or config loader in real app)
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'corridor_config.json')

def get_corridor_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)

class MatchService:
    """
    Mock Service to track P2P Match State.
    In production, this would be a database model (Matches table).
    """
    
    def __init__(self):
        # In-memory store for demo
        self.matches: Dict[str, Dict[str, Any]] = {}

    def create_match(self, match_id: str, user_a_id: str, user_b_id: str, amount: float, currency: str) -> Dict[str, Any]:
        self.matches[match_id] = {
            "id": match_id,
            "created_at": datetime.now(timezone.utc),
            "status": "CREATED",
            "user_a": {"id": user_a_id, "status": "PENDING_FUNDING"},
            "user_b": {"id": user_b_id, "status": "PENDING_FUNDING"},
            "amount": amount,
            "currency": currency,
            "payouts_triggered": False
        }
        return self.matches[match_id]

    def get_match(self, match_id: str) -> Optional[Dict[str, Any]]:
        return self.matches.get(match_id)



    def update_funding_status(self, match_id: str, role: str, status: str) -> Dict[str, Any]:
        match = self.matches.get(match_id)
        if not match:
            raise TruequeError(ErrorCode.RESOURCE_NOT_FOUND, f"Match {match_id} not found", 404)

        if role in ['user_a', 'user_b']:
            match[role]["status"] = status
        else:
            raise TruequeError(ErrorCode.VALIDATION_ERROR, f"Invalid role {role}", 400)
            
        return match

    def is_dual_funded(self, match_id: str) -> bool:
        match = self.matches.get(match_id)
        if not match:
            return False
            
        return (match["user_a"]["status"] == "FUNDED" and 
                match["user_b"]["status"] == "FUNDED")

    def check_rate_lock_expiry(self, match_id: str, window_minutes: int) -> bool:
        """
        Returns True if match has expired (exceeded rate lock window).
        """
        match = self.matches.get(match_id)
        if not match:
            return False # Or raise
            
        delta = datetime.now(timezone.utc) - match["created_at"]
        return delta > timedelta(minutes=window_minutes)

    def check_and_convert_to_merchant(self, match_id: str):
        match = self.matches.get(match_id)
        if not match:
            return None
            
        # Check if PENDING (or PENDING_FUNDING) and older than 2 mins
        # Use user_b status as proxy for "is the match waiting for funding"
        is_pending = match["user_b"]["status"] in ["PENDING_FUNDING", "PENDING"]
        
        if is_pending:
            delta = datetime.now(timezone.utc) - match["created_at"]
            if delta > timedelta(minutes=2): # Timeout
                 # Load Config
                 config = get_corridor_config()
                 
                 # Infer destination country. Default to MX if not found.
                 currency = match.get("currency", "MXN")
                 dest_cc = "MX"
                 for code, data in config.get("countries", {}).items():
                     if data.get("currency") == currency:
                         dest_cc = code
                         break

                 country_conf = config["countries"].get(dest_cc, {})
                 options = country_conf.get("merchant_options", [])
                 
                 match["status"] = "MERCHANT_BACKSTOP"
                 match["merchant_options"] = options
                 
                 print(f"Match {match_id} converted to MERCHANT_BACKSTOP. Options: {options}")
                 return match
        return None

    def release_match(self, match_id: str):
        match = self.matches.get(match_id)
        if match:
            match["status"] = "EXPIRED_RELEASED"

    def fulfill_merchant_voucher(self, match_id: str, merchant_id: int, db: Session):
        """
        Records the transaction as complete via Merchant Fulfillment.
        This closes the loop: User Funds -> Merchant Account.
        """
        match = self.matches.get(match_id)
        if not match:
             raise TruequeError(ErrorCode.RESOURCE_NOT_FOUND, f"Match {match_id} not found", 404)

        match["status"] = "COMPLETED_MERCHANT"
        match["merchant_id"] = merchant_id
        
        # 1. Fetch Merchant Wallet
        wallet = db.query(InternalWallet).filter(InternalWallet.user_id == merchant_id).first()
        if not wallet:
            # Create if missing (Auto-provision)
            # Fetch user to get currency?? Or infer from flow?
            # For now assume MXN as per flow or fetch User country.
            wallet = InternalWallet(user_id=merchant_id, currency="MXN", balance=0)
            db.add(wallet)
        
        # 2. Calculate Payout Amount (Mock Logic using Market Rate 21.00 for simulation)
        # Real logic would use the locked rate in the Match
        # Match data: amount (EUR source), but we need Payout Amount.
        # In this mock service, we didn't store Rate.
        # Let's derive it or use a fixed mock rate for this "Handshake".
        rate = Decimal("21.00")
        
        # Deduct Fees? The Amount in Match (154.27) is usually "Send Amount".
        # We need "Payout Amount".
        # Simplified: (Amount - 2.50) * Rate. 
        # CAUTION: Precision.
        
        eur_amount = Decimal(str(match["amount"])) # Convert float to Decimal explicitly
        net_eur = eur_amount - Decimal("2.50") # Gateway Fee
        payout_mxn = net_eur * rate
        
        # 3. Credit Wallet
        # SQLite + SQLAlchemy often return Decimal for Numeric columns, but verify intialization
        if wallet.balance is None: wallet.balance = 0.0
        wallet.balance += float(payout_mxn)
        
        # 4. Create Transaction Record
        import logging
        lg = logging.getLogger(__name__)
        
        txn = Transaction(
            tx_id=str(uuid.uuid4()),
            user_id=str(match["user_a"]["id"]),
            receiver_user_id=merchant_id,
            amount=float(eur_amount), # Keep float cast for safety
            from_currency=match["currency"],
            to_currency="MXN",
            rate=float(rate),
            status="COMPLETED",
            remittance_purpose="FAMILY_SUPPORT",
            timestamp=datetime.now(timezone.utc),
            sender_ip_address="127.0.0.1",
            kyc_tier_at_execution=0
        )
        db.add(txn)
        db.commit()
        
        return match
