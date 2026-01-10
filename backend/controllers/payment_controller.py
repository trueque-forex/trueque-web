
from typing import Dict, Any, Optional
from ..services.fee_orchestrator import FeeOrchestrator
from ..services.match_service import MatchService
from ..gateway.gateway_registry import GatewayRegistry, Recipient

class PaymentController:
    """
    Controller that coordinates payment authorizations, quotes, and Payouts (P2P Mirroring).
    Uses FeeOrchestrator for pricing and MatchService for dual-funding checks.
    """
    
    def __init__(self):
        self.fee_orchestrator = FeeOrchestrator()
        self.match_service = MatchService() # In-memory mock for now
        self.rate_lock_window = 15 # Default, should load from config

    def get_authorization_quote(
        self, 
        amount_send: float, 
        currency_from: str, 
        currency_to: str, 
        mid_market_rate: float, 
        payment_method: str = 'bank_transfer',
        outbound_method: str = 'bank_rtp',
        trueque_id: str = None,
        tier: str = 'standard'
    ) -> Dict[str, Any]:
        """
        Generates a quote with full fee breakdown for user authorization.
        """
        # Ensure we read the config's rate lock window if available
        # (Simplified: logic in orchestrator or here)
        return self.fee_orchestrator.get_transparent_quote(
            amount_send=amount_send,
            currency_from=currency_from,
            currency_to=currency_to,
            mid_market_rate=mid_market_rate,
            payment_method=payment_method,
            outbound_method=outbound_method,
            trueque_id=trueque_id
        )

    
    def _secure_lookup_recipient(self, transaction_id: str) -> Dict[str, Any]:
        """
        MOCK: Securely looks up tokenized recipient data from the encrypted Vault.
        In production, this queries the DB using the TxID.
        """
        # Mock logic based on TxID hash or similar
        # For demo, returning fixed data structure that matches 'Recipient'
        return {
            "type": "bank",
            "name": "Maria Gonzalez",
            "iban": "ES1234567890123456789012",
            "bank_name": "BBVA",
            "country": "ES"
        }

    def trigger_payout(
        self, 
        transaction_id: str,
        quote_details: Dict[str, Any],
        outbound_rail: str = None
    ) -> Dict[str, Any]:
        """
        Triggers the actual payout using authorized quote.
        PRIVACY: Does NOT accept raw PII. Looks it up internally.
        """
        try:
            # 1. Secure Lookup
            recipient_data = self._secure_lookup_recipient(transaction_id)
            if not recipient_data:
                 raise ValueError("Transaction/Recipient not found in Vault")

            # 2. Dynamic Orchestration: Validate/Override Rail if provided
            # The 'quote_details' usually has 'outbound_method' from the signed quote.
            # But the 'Atlas' lookup requirement implies we might re-check or enforce.
            # For now, we trust the secure quote parameters.
            
            # 3. Construct Recipient
            recipient = Recipient(**recipient_data)
            
            # 4. Select Gateway (Dynamic Rail Selection)
            gateway = GatewayRegistry.select_gateway(recipient)
            
            # 5. Execute Payout
            payout_ref = gateway.send_payout(recipient)
            
            return {
                "success": True,
                "status": "processing",
                "payout_reference": payout_ref,
                "gateway": gateway.name,
                "amount_net": quote_details.get("net_payout_amount"),
                "currency": quote_details.get("target_currency")
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
        
        print(f"[Webhook] Received {event_type} for Msatch {match_id} (User {role}): {status}")

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
            print(f"   >>> [Timeout] Match {match_id} EXPIRED. ROLBACK initiated.")
            self.match_service.release_match(match_id)
            return {"status": "expired", "action": "rollback"}
            
        return {"status": "active"}

    def _get_liquidity_fee_label(self, payload) -> str:
        return "1% (Standard Card Advance)"
