from decimal import Decimal
from typing import Dict, Any, Optional
from ..services.fee_orchestrator import FeeOrchestrator
from ..services.match_service import MatchService
from ..gateway.gateway_registry import GatewayRegistry, Recipient

class PaymentController:
    """
    Controller that coordinates payment authorizations, quotes, and Payouts (P2P Mirroring).
    Enforces Symmetri's strict Gross Fee calculation to prevent FX ledger leakage.
    """
    
    def __init__(self):
        self.fee_orchestrator = FeeOrchestrator()
        self.match_service = MatchService() # In-memory mock for now
        self.rate_lock_window = 15 # Default, should load from config

    def get_authorization_quote(
        self, 
        principal: Decimal, 
        currency_from: str, 
        currency_to: str, 
        mid_market_rate: Decimal, 
        payment_method: str = 'RTP',
        outbound_method: str = 'bank_rtp',
        trueque_id: str = None,
        tier: str = 'standard'
    ) -> Dict[str, Any]:
        """
        Orchestrator Logic: Calculates total cost based on the exact base principal.
        """
        # Dynamic Asymmetric Fee Splitting
        # Business (>= $5000) pays 1.0%, otherwise 1.5%. Applied to ENTIRE volume.
        is_business = principal >= Decimal('5000.00')
        symmetri_fee_percent = Decimal('0.010') if is_business else Decimal('0.015')
        symmetri_fee_amount = (principal * symmetri_fee_percent).quantize(Decimal('0.01'))

        # Dynamic Gateway Fee
        gateway_fee_amount = Decimal('0.00')
        method = payment_method.upper()
        if method == 'RTP':
            gateway_fee_amount = Decimal('1.00')
        elif method == 'CARD':
            gateway_fee_percent = Decimal('0.025')
            gateway_fee_amount = (principal * gateway_fee_percent).quantize(Decimal('0.01'))
        
        # Total to Pay
        total_to_pay = principal + symmetri_fee_amount + gateway_fee_amount

        # Family Receives
        target_payout_amount = (principal * mid_market_rate).quantize(Decimal('0.01'))

        # Build Dictionary
        quote_details = {
            "principal": float(principal),
            "symmetri_fee_amount": float(symmetri_fee_amount),
            "gateway_fee_amount": float(gateway_fee_amount),
            "total_to_pay": float(total_to_pay),
            "target_payout_amount": float(target_payout_amount),
            "currency_from": currency_from,
            "exchange_rate_used": float(mid_market_rate),
            "currency_to": currency_to,
            "rate_lock_window_mins": self.rate_lock_window,
            "payment_method": method,
            "outbound_method": outbound_method
        }
        
        return quote_details

    def _secure_lookup_recipient(self, transaction_id: str) -> Dict[str, Any]:
        """
        MOCK: Securely looks up tokenized recipient data from the encrypted Vault.
        In production, this queries the DB using the TxID.
        """
        return {
            "type": "bank",
            "name": "Maria Gonzalez",
            "iban": "ES1234567890123456789012",
            "bank_name": "BBVA",
            "country": "MX" # changed to MX for SPEI context test
        }

    def trigger_payout(
        self, 
        transaction_id: str,
        quote_details: Dict[str, Any],
        match_result: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Triggers the actual payout using authorized quote.
        MTL Ready: Directly routes through FBO integrators (Direct_Bank_RTP / Direct_Bank_SPEI).
        Ledger Wall: Segregates P2P funding (FBO) and Treasury funding (CORPORATE_ACCOUNT).
        """
        try:
            # 1. Secure Lookup
            recipient_data = self._secure_lookup_recipient(transaction_id)
            if not recipient_data:
                 raise ValueError("Transaction/Recipient not found in Vault")

            # 2. Ledger Split Identification
            # By default, 100% of volume comes from P2P matchers on the FBO account.
            total_principal = Decimal(str(quote_details.get("principal", 0)))
            treasury_used = Decimal('0.00')
            
            if match_result and match_result.get("is_treasury_active"):
                treasury_used = Decimal(str(match_result.get("treasury_usd", 0)))
                
            p2p_used = total_principal - treasury_used
            
            funding_splits = {}
            if p2p_used > 0:
                funding_splits["FBO_ACCOUNT"] = float(p2p_used)
            if treasury_used > 0:
                funding_splits["CORPORATE_ACCOUNT"] = float(treasury_used)

            # 3. Direct Bank API Routine (MTL Preparations)
            currency = quote_details.get("currency_to", "USD")
            
            # The exact UX Rule: Bundled as one logical transfer with split internal funding accounts.
            payout_ref = f"MTL-DIR-{transaction_id[:8]}"
            gateway_name = "Direct_Bank_RTP" if currency == "USD" else "Direct_Bank_SPEI"
            
            print(f"[{gateway_name}] Executing Unified Transfer: {payout_ref}")
            if "CORPORATE_ACCOUNT" in funding_splits:
                print(f"   >>> Ledger Wall: Sub-Routing ${funding_splits['CORPORATE_ACCOUNT']:,.2f} from internal Treasury Corporate Account.")
            
            return {
                "success": True,
                "status": "processing",
                "payout_reference": payout_ref,
                "gateway": gateway_name,
                "amount_net": quote_details.get("target_payout_amount"),
                "currency": currency,
                "funding_ledger_split": funding_splits
            }
            
        except Exception as e:
            return {
                "success": False,
                "status": "failed",
                "error": str(e)
            }

    def handle_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standardized Webhook Handler for Gateway Events.
        Orchestrates P2P Mirroring Flow.
        """
        event_type = payload.get('event_type') # e.g. "payment_confirmed"
        status = payload.get('status')
        tx_id = payload.get('transaction_id')
        match_id = payload.get('match_id') # Metadata passed to gateway
        role = payload.get('role') # 'user_a' or 'user_b'
        
        print(f"[Webhook] Received {event_type} for Match {match_id} (User {role}): {status}")

        if not match_id:
             # Basic single payment flow logic (legacy/non-p2p)
             if status == 'authorized' and payload.get('payment_method') == 'card':
                 return self._handle_liquidity_advance(payload)
             return {"action": "logged_no_match", "success": True}

        # P2P Logic
        if event_type == "payment_confirmed" or status == "FUNDED":
            # 1. Update Match State
            try:
                self.match_service.update_funding_status(match_id, role, "FUNDED")
                print(f"   >>> [MatchService] User {role} FUNDED match {match_id}")
                
                # 2. Check Dual Funding
                if self.match_service.is_dual_funded(match_id):
                    print(f"   >>> [MatchService] DUAL FUNDING COMPLETE. Triggering Mirror Payouts!")
                    return self._trigger_mirror_payouts(match_id)
                else:
                    return {"action": "match_updated_waiting_peer", "success": True}
                    
            except Exception as e:
                print(f"   !!! Error updating match: {e}")
                return {"action": "error", "error": str(e)}

        return {"action": "logged_ignored", "success": True}

    def _handle_liquidity_advance(self, payload) -> Dict[str, Any]:
        tx_id = payload.get('transaction_id')
        print(f"   >>> [Liquidity Protocol] ADVANCING FUNDS for Tx {tx_id} (Card Rail)")
        print(f"   >>> [Liquidity Protocol] Fee Applied: {self._get_liquidity_fee_label(payload)}")
        return {"action": "liquidity_advance_triggered", "success": True}

    def _trigger_mirror_payouts(self, match_id: str) -> Dict[str, Any]:
        # In a real app, we'd lookup the specific quote for each user.
        # Here we mock triggering based on the TxIDs associated with the match.
        # User A sent funds -> Payout to User B's beneficiary
        # User B sent funds -> Payout to User A's beneficiary
        
        # Mock triggering
        print(f"   >>> [P2P Controller] Executing Payout for User A's Beneficiary...")
        print(f"   >>> [P2P Controller] Executing Payout for User B's Beneficiary...")
        
        # We would call self.trigger_payout(...) here with real data
        
        return {"action": "mirror_payouts_triggered", "success": True}

    def check_timeouts(self, match_id: str) -> Dict[str, Any]:
        """
        Checks if Rate Lock Window (15m) has expired.
        """
        # Load from config if possible, else default 15
        # For this refactor, we use the class default or global config
        
        expired = self.match_service.check_rate_lock_expiry(match_id, self.rate_lock_window)
        if expired:
            print(f"   >>> [Timeout] Match {match_id} EXPIRED. ROLLBACK initiated.")
            self.match_service.release_match(match_id)
            return {"status": "expired", "action": "rollback"}
            
        return {"status": "active"}

    def _get_liquidity_fee_label(self, payload) -> str:
        return "1% (Standard Card Advance)"