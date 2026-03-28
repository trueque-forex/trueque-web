
import json
import os
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Any, Optional

class FeeCalculator:
    _config = None

    @classmethod
    def _load_config(cls):
        # Always reload in dev to pick up changes, or cache in prod
        # For this session, we'll reload to be safe
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'corridor_config.json')
        with open(config_path, 'r') as f:
            cls._config = json.load(f)
        return cls._config

    @classmethod
    def calculate_best_route(cls, country_code: str, amount: Decimal, currency: str) -> List[Dict[str, Any]]:
        """
        LCR: Returns a list of payment options sorted by total cost (cheapest first).
        Adapted for new config schema (outbound_rails).
        """
        config = cls._load_config()
        country_data = config.get("countries", {}).get(country_code)
        
        if not country_data:
            return []
        
        # New Schema uses "outbound_rails"
        outbound_rails = country_data.get("outbound_rails", {})
        options = []

        for method_key, fee_struct in outbound_rails.items():
            # Fee = (Amount * pct) + fixed
            # Note: Current schema 'outbound_rails' uses 'cost' which implies fixed for now, 
            # OR we check if it has 'pct'/'fixed'. The prompt example shows "cost": 0.00 or "cost": 1.25.
            # We'll support both formats for robustness.
            
            amt_dec = amount
            rail_cost = Decimal("0.00")
            
            if "cost" in fee_struct:
                rail_cost = Decimal(str(fee_struct["cost"]))
            else:
                pct = Decimal(str(fee_struct.get("pct", 0.0)))
                fixed = Decimal(str(fee_struct.get("fixed", 0.0)))
                rail_cost = (amt_dec * pct) + fixed
            
            # Labeling Logic
            label = None
            if rail_cost == 0:
                label = "Trueque Social Pick: 0% Bank Fees"
            
            options.append({
                "method": method_key,
                "display_name": fee_struct.get("label", method_key),
                "rail_cost": float(rail_cost),
                "promo_label": label
            })

        # Sort by cost
        options.sort(key=lambda x: x["rail_cost"])
        
        return options

    @classmethod
    def calculate_friction(cls, 
                           source_country: str, 
                           dest_country: str, 
                           amount_principal: Decimal, 
                           inbound_method: str, 
                           outbound_method: str,
                           db: Optional[Any] = None,
                           user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates the 7-layer friction stack.
        Ensures the 'amount_principal' is the SACRED AMOUNT received by beneficiary.
        """
        config = cls._load_config()
        
        # 0. Setup Decimals
        principal = amount_principal
        
        src_data = config["countries"].get(source_country, {})
        dst_data = config["countries"].get(dest_country, {})
        
        # 1. Inbound Friction (Source)
        # "inbound_gateways"
        inbound_cfg = src_data.get("inbound_gateways", {}).get(inbound_method, {})
        inbound_pct = Decimal(str(inbound_cfg.get("pct", 0.0)))
        inbound_fixed = Decimal(str(inbound_cfg.get("fixed", 0.0)))
        
        inbound_fee = (principal * inbound_pct) + inbound_fixed
        
        # 2. Outbound Friction (Dest)
        outbound_cfg = dst_data.get("outbound_rails", {}).get(outbound_method, {})
        outbound_fee = Decimal("0.00")
        if "cost" in outbound_cfg:
             outbound_fee = Decimal(str(outbound_cfg["cost"]))
        else:
             o_pct = Decimal(str(outbound_cfg.get("pct", 0.0)))
             o_fixed = Decimal(str(outbound_cfg.get("fixed", 0.0)))
             outbound_fee = (principal * o_pct) + o_fixed

        # 3. Liquidity
        liq_pct = Decimal(str(config.get("liquidity_buffer_pct", 0.0)))
        liquidity_fee = principal * liq_pct
        
        # 4. Trueque Fee
        # Logic: If (current + last_24h_volume > 500) -> 1.2%. Else fixed.
        trueque_fee_base = Decimal(str(config.get("global_facillitation_fee", 0.0)))
        
        if db and user_id:
            # Query last 24h volume
            from ..models.offer_model import Offer
            from ..models.transaction import Transaction # If we count completed too
            from sqlalchemy import func
            from datetime import datetime, timedelta, timezone

            now = datetime.now(timezone.utc)
            start_monitor = now - timedelta(hours=24)
            
            # Using Offer table for "Attempts/Intent" volume as per risk engine style, 
            # or Transaction for strict settled volume? 
            # Prompt says "Rolling Volume Audit". Let's check "Offer" volume as it covers what they are *doing*.
            
            vol_24h = db.query(func.sum(Offer.amount)).filter(
                Offer.user_id == user_id,
                Offer.timestamp >= start_monitor
            ).scalar() or 0.0
            
            current_total = Decimal(str(vol_24h)) + amount_principal
            
            if current_total > 500:
                # Apply 1.2% rate
                # Is it 1.2% of current swap? Yes "apply ... to the current swap".
                trueque_fee_base = principal * Decimal("0.012")
        
        
        # 5. Tax
        # "Tax: Apply tax_rate_on_fees only to the Trueque fee."
        tax_rate = Decimal(str(src_data.get("tax_rate_on_fees", 0.0)))
        tax_fee = trueque_fee_base * tax_rate
        
        # 6. Total
        total_fees = inbound_fee + outbound_fee + liquidity_fee + trueque_fee_base + tax_fee
        final_payment = principal + total_fees
        
        # Rounding (2 decimals standard)
        def quantize(d):
            return d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            
        return {
            "sacred_principal": float(quantize(principal)),
            "breakdown": {
                "inbound_friction": float(quantize(inbound_fee)),
                "outbound_friction": float(quantize(outbound_fee)),
                "liquidity_buffer": float(quantize(liquidity_fee)),
                "trueque_fee": float(quantize(trueque_fee_base)),
                "local_tax": float(quantize(tax_fee))
            },
            "total_friction": float(quantize(total_fees)),
            "gross_payment_amount": float(quantize(final_payment)),
            "currency": src_data.get("currency", "USD")
        }
