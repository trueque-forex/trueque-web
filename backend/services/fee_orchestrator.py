import hashlib
import json
import os
import uuid
from typing import Dict, Any
from decimal import Decimal, ROUND_FLOOR, getcontext
from ..connectors.factory import ConnectorFactory

# Set precision context
getcontext().prec = 28

class FeeOrchestrator:
    def __init__(self):
        # Load Corridor Config (The Atlas)
        config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'corridor_config.json')
        try:
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        except Exception as e:
            print(f"Error loading corridor config: {e}")
            self.config = {}

    def _parse_country_from_id(self, trueque_id: str) -> str:
        """
        Extracts country code from TYYYYMMDDCCSSSSK format.
        """
        if not trueque_id or len(trueque_id) < 16:
            return None
        # CC is at index 9:11 (0-indexed) -> T(0) Y4 M2 D2 C2...
        try:
            cc = trueque_id[9:11]
            return cc.upper()
        except:
            return None

    def get_transparent_quote(
        self, 
        amount_send: float, 
        currency_from: str, 
        currency_to: str, 
        mid_market_rate: float,
        payment_method: str = 'bank_transfer',
        outbound_method: str = 'bank_rtp',
        trueque_id: str = None,
        tier: str = 'T1',
        country_from: str = None, 
        country_to: str = None
    ) -> Dict[str, Any]:
        """
        Generates a transparent quote using Gross-to-Net logic driven by corridor_config.json.
        Uses Decimal for all monetary calculations.
        """
        
        # Convert inputs to Decimal
        d_amount_send = Decimal(str(amount_send)) if amount_send is not None else Decimal('0')
        d_mid_market_rate = Decimal(str(mid_market_rate)) if mid_market_rate is not None else Decimal('0')

        # 1. Determine Corridor / Regions
        id_country = self._parse_country_from_id(trueque_id)
        
        def_country_from = "US"
        def_country_to = "ES" if currency_to == "EUR" else ("AR" if currency_to == "ARS" else "US")

        if not country_from:
            country_from = id_country if id_country else def_country_from
        
        if not country_to:
            country_to = def_country_to

        # Helpers to get config safely
        countries = self.config.get('countries', {})
        global_ov = self.config.get('global_overrides', {})
        
        src_config = countries.get(country_from, countries.get('default'))
        dst_config = countries.get(country_to, countries.get('default'))

        # 2. Base Structural Costs
        # Use Decimal for fees
        GATEWAY_TECH_FEE = Decimal(str(global_ov.get('gateway_tech_fee', 2.50)))
        PLATFORM_FEE_PCT = Decimal(str(global_ov.get('trueque_fee_base', 0.005)))
        
        # 3. Inbound Fees (Source Friction)
        inbound_fees = src_config.get('inbound_fees', {})
        method_fee = inbound_fees.get(payment_method, inbound_fees.get('bank_transfer')) # fallback
        
        inbound_pct = Decimal(str(method_fee.get('pct', 0.0)))
        inbound_fixed = Decimal(str(method_fee.get('fixed', 0.0)))
        
        inbound_fee = (d_amount_send * inbound_pct) + inbound_fixed

        # 4. Liquidity Fee (Advanced Financing)
        liquidity_fee = Decimal('0.0')
        if payment_method == 'card':
            buffer_pct = Decimal(str(src_config.get('liquidity_buffer', 0.0)))
            
            # HOLIDAY SCALING LOGIC
            holiday_mode_country = os.environ.get('HOLIDAY_MODE', '')
            if holiday_mode_country and holiday_mode_country == country_to:
                print(f"   >>> [FeeOrchestrator] HOLIDAY DETECTED for {country_to}. Scaling Liquidity Fee.")
                buffer_pct *= Decimal('2.0')
            
            liquidity_fee = d_amount_send * buffer_pct
            
        # 5. Trueque Platform Fee
        platform_fee = d_amount_send * PLATFORM_FEE_PCT
        
        # 6. Gateway Outbound / Payout Fee (Destination Friction)
        outbound_fees = dst_config.get('outbound_fees', {})
        out_fee_struct = outbound_fees.get(outbound_method, outbound_fees.get('bank_rtp'))
        
        out_pct = Decimal(str(out_fee_struct.get('pct', 0.0)))
        out_fixed = Decimal(str(out_fee_struct.get('fixed', 0.0)))
        
        # Calculate roughly on principal (Gross)
        gateway_outbound = (d_amount_send * out_pct) + out_fixed

        # 7. Local Taxes (Destination)
        tax_rate = Decimal(str(dst_config.get('taxes', 0.0)))
        
        # Gross Receive = Principal * Rate
        gross_receive_dest = d_amount_send * d_mid_market_rate
        local_taxes = gross_receive_dest * tax_rate

        # Convert Destination Taxes to Source Currency for the Total Friction Sum
        local_taxes_source = Decimal('0.0')
        if d_mid_market_rate > 0:
            local_taxes_source = local_taxes / d_mid_market_rate

        # TOTAL FRICTION (Source Currency)
        total_friction = inbound_fee + liquidity_fee + GATEWAY_TECH_FEE + gateway_outbound + platform_fee + local_taxes_source
        
        # Round logic (FLOOR) - Standardize to 2 decimals for display/charging?
        # Typically internal calc keeps precision, but final fee quote might round.
        # Let's keep precision for now or round up/down per policy.
        # Request said: "Round Down" (Floor) or "Half Up".
        # Let's Apply Round Down (Floor) to 2 decimals for fees if we were charging, 
        # but for internal "Net Principal" calculation, maintaining precision is safer until final step.
        # However, to avoid "overcharging", flooring the COST might mean under-collecting.
        # Actually usually you standard rounding for fees.
        # Let's just ensure we return float for JSON compat at the end.

        # NET PAYOUT
        net_principal = d_amount_send - total_friction
        if net_principal < 0:
            net_principal = Decimal('0')
            
        net_payout_amount = net_principal * d_mid_market_rate
        
        # Breakdown Dictionary (Convert back to float for JSON)
        breakdown = {
            "inbound_fee": float(inbound_fee),
            "liquidity_fee": float(liquidity_fee),
            "gateway_tech_fee": float(GATEWAY_TECH_FEE),
            "gateway_outbound_fee": float(gateway_outbound),
            "trueque_platform_fee": float(platform_fee),
            "local_taxes_source_equiv": float(local_taxes_source),
            "local_taxes_dest_est": float(local_taxes),
            "total_friction": float(total_friction)
        }

        # Metrics for response
        total_cost_percentage = (total_friction / d_amount_send) * 100 if d_amount_send > 0 else Decimal('0')
        effective_exchange_rate = net_payout_amount / d_amount_send if d_amount_send > 0 else Decimal('0')

        return {
            "quote_id": f"qt_{uuid.uuid4().hex[:8]}",
            "breakdown": breakdown,
            "mid_market_rate": float(d_mid_market_rate),
            "effective_exchange_rate": float(effective_exchange_rate),
            "total_cost_percentage": float(round(total_cost_percentage, 4)),
            "source_currency": currency_from,
            "target_currency": currency_to,
            "principal_amount": float(d_amount_send),     # Gross Send
            "net_payout_amount": float(net_payout_amount), # Net Receive
            "payment_method": payment_method,
            "outbound_method": outbound_method,
            "exchange_rate_guarantee": f"Guaranteed by Gateway for 0h (Instant)",
            "corridor": f"{country_from}-{country_to}"
        }