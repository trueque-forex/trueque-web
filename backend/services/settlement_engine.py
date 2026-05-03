
import logging
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime

from backend.services.identity_matcher import IdentityMatcher
# Assuming accessing PaymentController/Gateway for execution might be needed later, 
# but for now we focus on the logic described.

class TransactionStatus(str, Enum):
    CREATED = "CREATED"
    PENDING = "PENDING"       # Identity Match verified, waiting for funds
    AUTHORIZED = "AUTHORIZED" # Inbound funds received
    SETTLED = "SETTLED"       # Outbound payout executed
    FAILED = "FAILED"

class SettlementEngine:
    """
    Manages the lifecycle of a Trueque transaction with Verify-then-Pay logic.
    Implements Execution Surcharge (Option B).
    """
    
    def __init__(self):
        self.identity_matcher = IdentityMatcher()
        # In a real app, we'd inject a database session here
        self._mock_db = {} # Simulating DB for this session

    def initiate_settlement(self, transaction_id: str, sender_country: str, recipient_country: str, 
                           recipient_name: str, recipient_identifier: str) -> Dict[str, Any]:
        """
        Step 1: Verify Identity and Transition to PENDING.
        """
        logging.info(f"Initiating settlement for {transaction_id}")
        
        # 1. Identity Verification
        match_result = self.identity_matcher.match_identity(
            recipient_country, recipient_identifier, recipient_name
        )
        
        if not match_result.get("match"):
             return {
                "success": False,
                "status": TransactionStatus.FAILED,
                "reason": "Identity verification failed",
                "details": match_result
            }
            
        # 2. Transition State
        self._update_state(transaction_id, TransactionStatus.PENDING)
        
        return {
            "success": True,
            "status": TransactionStatus.PENDING,
            "message": "Identity verified. Waiting for inbound funds.",
            "match_details": match_result
        }

    def confirm_inbound(self, transaction_id: str, amount_received: float, 
                       quote_expected_amount: float, total_friction: float) -> Dict[str, Any]:
        """
        Step 2: Confirm Inbound Funds and Apply Surcharge (Option B).
        Transitions to AUTHORIZED.
        """
        logging.info(f"Confirming inbound for {transaction_id}. Received: {amount_received}")
        
        # Tolerance check (using hardcoded tolerance for simplicity, ideally from tolerance.py)
        tolerance = 1.0 
        if abs(amount_received - quote_expected_amount) > tolerance:
             return {
                "success": False,
                "status": TransactionStatus.FAILED,
                "reason": f"Amount mismatch. Expected {quote_expected_amount}, got {amount_received}"
            }

        # Option B: Execution Surcharge Logic
        # "Total collected at source" = amount_received
        # "Subtract form total collected ... to cover platform's costs"
        # Net Principal = Amount Received - Total Friction
        
        net_principal = amount_received - total_friction
        
        if net_principal <= 0:
             return {
                "success": False,
                "status": TransactionStatus.FAILED,
                "reason": "Friction exceeds principal amount due to Option B logic."
            }

        # Store financial context
        self._mock_db[transaction_id] = {
            "amount_collected": amount_received,
            "total_friction_deducted": total_friction,
            "net_principal_to_convert": net_principal
        }
        
        self._update_state(transaction_id, TransactionStatus.AUTHORIZED)
        
        return {
            "success": True,
            "status": TransactionStatus.AUTHORIZED,
            "net_principal": net_principal,
            "friction_collected": total_friction,
            "message": "Inbound funds confirmed. Surcharge deducted. Ready for settlement."
        }

    def execute_payout(self, transaction_id: str, net_principal: float, mid_market_rate: float) -> Dict[str, Any]:
        """
        Step 3: Execute Outbound Payout using Mirror Logic.
        Transitions to SETTLED.
        """
        context = self._mock_db.get(transaction_id)
        if not context:
             # In real world, fetch from DB
             context = {"net_principal_to_convert": net_principal}

        # Calculate final amount for beneficiary
        # Recipient Amount = Net Principal * Rate
        recipient_amount = context["net_principal_to_convert"] * mid_market_rate
        
        # ... logic to call PaymentController / GatewayRegistry would go here ...
        # For this exercise, we simulate success
        
        self._update_state(transaction_id, TransactionStatus.SETTLED)
        
        return {
            "success": True,
            "status": TransactionStatus.SETTLED,
            "payout_amount": recipient_amount,
            "message": "Domestic mirror-payout executed."
        }

    def _update_state(self, transaction_id: str, new_state: TransactionStatus):
        logging.info(f"Transaction {transaction_id} transitioned to {new_state}")
        # DB Update logic here
        pass
