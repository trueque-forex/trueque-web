
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
    def calculate_best_route(cls, country_code: str, amount: float, currency: str) -> List[Dict[str, Any]]:
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
            
            amt_dec = Decimal(str(amount))
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
                           amount_principal: float, 
                           inbound_method: str, 
                           outbound_method: str) -> Dict[str, Any]:
        """
        Calculates the 7-layer friction stack.
        Ensures the 'amount_principal' is the SACRED AMOUNT received by beneficiary.
        """
        config = cls._load_config()
        
        # 0. Setup Decimals
        principal = Decimal(str(amount_principal))
        
        src_data = config["countries"].get(source_country, {})
        dst_data = config["countries"].get(dest_country, {})
        
        # 1. Inbound Friction (Source)
        # "inbound_gateways"
        inbound_cfg = src_data.get("inbound_gateways", {}).get(inbound_method, {})
        inbound_pct = Decimal(str(inbound_cfg.get("pct", 0.0)))
        inbound_fixed = Decimal(str(inbound_cfg.get("fixed", 0.0)))
        
        # Inbound fee is usually calculated on the GROSS amount the user pays? 
        # OR on the Principal? 
        # Standard: Fee = (Principal * Pct) + Fixed. 
        # If it needs to be "Gross Up" (i.e. User pays X so that after fees we have Principal), 
        # the math is: Gross = (Principal + Fixed) / (1 - Pct).
        # PROMPT SAYS: "Swapper's total covers all layers".
        # STEP 6 in prompt says: "Final_Payment = Principal + Inbound + Outbound + Liquidity + Trueque + Tax".
        # This implies "Additive" logic on top of Principal.
        # "Inbound: Pulls from inbound_gateways...". 
        # If I strictly follow: Total = P + (P*% + Fixed) + ...
        # This is strictly additive.
        
        inbound_fee = (principal * inbound_pct) + inbound_fixed
        
        # 2. Outbound Friction (Dest)
        # "outbound_rails". Prompt schema shows "cost".
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
        trueque_fee_base = Decimal(str(config.get("global_facillitation_fee", 0.0)))
        
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
