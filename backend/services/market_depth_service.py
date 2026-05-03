from decimal import Decimal
from typing import Optional, Dict, Any, List
from sqlalchemy import desc
from backend.database import SessionLocal
from backend.models.offer_model import Offer

class MarketDepthService:
    # --- GLOBAL VELOCITY OBERVERS (MOCK STATE) ---
    MAX_DAILY_TREASURY_SPEND = Decimal('10000.00')
    current_daily_treasury_spend = Decimal('0.00')
    available_treasury_budget = Decimal('50000.00')

    def __init__(self):
        # We assume a fixed mock mid-market rate for Phase 2 adjustement.
        self.mock_mid_market_rate = Decimal('20.00')

    def get_persona_limits(self, target_usd: Decimal) -> Dict[str, Any]:
        if target_usd < Decimal('500.00'):
            return {"tier": "RETAIL", "max_matchers": 1, "anchor_floor_usd": Decimal('0.00')}
        elif target_usd < Decimal('5000.00'):
            return {"tier": "PRO", "max_matchers": 3, "anchor_floor_usd": Decimal('100.00')}
        else:
            return {"tier": "BUSINESS", "max_matchers": 10, "anchor_floor_usd": Decimal('500.00')}

    def get_aggregated_match(self, target_usd_principal: Decimal) -> Dict[str, Any]:
        """
        The Adjuster v2: Liquidity Aggregation Engine.
        Scans offers with Persona-based constraints and Treasury fallback with Velocity Risk logic.
        """
        db = SessionLocal()
        try:
            target_mxn = target_usd_principal * self.mock_mid_market_rate
            limits = self.get_persona_limits(target_usd_principal)
            
            tier = limits["tier"]
            max_matchers = limits["max_matchers"]
            floor_mxn = limits["anchor_floor_usd"] * self.mock_mid_market_rate
            
            # 1. Fetch available P2P Liquidity
            open_offers = db.query(Offer).filter(
                Offer.currency_offered == 'MXN',
                Offer.status == 'open'
            ).order_by(desc(Offer.amount_offered)).all()

            chosen_matchers = []
            cumulative_mxn = Decimal('0.00')
            
            # 2. Match loop
            for offer in open_offers:
                if len(chosen_matchers) >= max_matchers:
                    break
                    
                gap_mxn = target_mxn - cumulative_mxn
                if gap_mxn <= 0:
                    break
                    
                amount_to_use = min(offer.amount_offered, gap_mxn)
                
                meets_floor = amount_to_use >= floor_mxn
                is_closer = (amount_to_use == gap_mxn) 
                
                if meets_floor or is_closer:
                    chosen_matchers.append({
                        "offer_id": str(offer.id),
                        "amount_mxn": float(amount_to_use),
                        "amount_usd": float(amount_to_use / self.mock_mid_market_rate)
                    })
                    cumulative_mxn += amount_to_use

            remaining_gap_mxn = target_mxn - cumulative_mxn
            remaining_gap_usd = remaining_gap_mxn / self.mock_mid_market_rate
            treasury_used_usd = Decimal('0.00')
            
            # 3. Symmetri Treasury Node (Executor Mode with Dual-Lock Risk Circuit)
            # Symmetri Core Value: Transparent, flat fees. No hidden premiums on Treasury liquidity.
            if remaining_gap_usd > 0 and len(chosen_matchers) < max_matchers:
                # DUAL-LOCK CHECK
                lock_1_pass = (remaining_gap_usd <= Decimal('500.00'))
                lock_2_pass = ((MarketDepthService.current_daily_treasury_spend + remaining_gap_usd) <= MarketDepthService.MAX_DAILY_TREASURY_SPEND)
                budget_pass = (remaining_gap_usd <= MarketDepthService.available_treasury_budget)

                if tier != "RETAIL" and lock_1_pass and lock_2_pass and budget_pass:
                    treasury_used_usd = remaining_gap_usd
                    chosen_matchers.append({
                        "offer_id": "SYMMETRI_TREASURY_NODE",
                        "amount_mxn": float(remaining_gap_mxn),
                        "amount_usd": float(remaining_gap_usd)
                    })
                    cumulative_mxn += remaining_gap_mxn
                    # Velocity Observers applied!
                    MarketDepthService.current_daily_treasury_spend += remaining_gap_usd
                    MarketDepthService.available_treasury_budget -= remaining_gap_usd
                    remaining_gap_usd = Decimal('0.00')

            # 4. Fallback: Adjuster Recommendation
            if remaining_gap_usd > 0:
                # Unable to fill entirely (Velocity limits hit, or purely too large).
                adjusted_usd = cumulative_mxn / self.mock_mid_market_rate
                return {
                    "status": "PARTIAL",
                    "original_usd_target": float(target_usd_principal),
                    "adjusted_principal_usd": float(adjusted_usd),
                    "matched_offers": chosen_matchers,
                    "treasury_usd": float(treasury_used_usd),
                    "message": f"Market maxed out or safety limits engaged. Adjust target to ${adjusted_usd:,.2f} for instant 1:1 match."
                }

            # Completely filled successfully
            return {
                "status": "FILLED",
                "original_usd_target": float(target_usd_principal),
                "matched_offers": chosen_matchers,
                "treasury_usd": float(treasury_used_usd),
                "is_treasury_active": treasury_used_usd > 0
            }

        except Exception as e:
            print(f"Error in Aggregation Adjuster: {e}")
            import traceback
            traceback.print_exc()
            return {"status": "ERROR"}
        finally:
            db.close()
