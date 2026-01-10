import json
import os
import traceback
from datetime import datetime
from decimal import Decimal, getcontext

from fastapi import APIRouter, HTTPException, Query

from ..controllers.payment_controller import PaymentController

# Helper (Should be shared)
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'corridor_config.json')

def get_config_currencies():
    try:
        with open(CONFIG_PATH, 'r') as f:
            data = json.load(f)
            # Extract all currencies from countries + Sender/Receiver assumption
            # For now, just gathering unique currencies found in country defs
            currencies = set()
            for c in data.get("countries", {}).values():
               currencies.add(c.get("currency"))
            # Ensure major source pairs present if not explicitly in countries (e.g. EUR is there)
            return list(currencies)
    except:
        return ['USD', 'EUR', 'MXN', 'ARS', 'COP', 'BRL', 'CLP', 'GTQ', 'DOP', 'PEN', 'GHS', 'NGN'] # Fallback

router = APIRouter(prefix="/api/quotes", tags=["Quotes"])
controller = PaymentController()

# Set decimal precision for safe currency math
getcontext().prec = 28

@router.get("/transparent")
async def get_transparent_quote(
    amount: float = Query(..., gt=0),
    currency_from: str = Query(..., min_length=3, max_length=3),
    currency_to: str = Query(..., min_length=3, max_length=3),
    rate: float = Query(..., gt=0),
    tier: str = Query("T1"),
    inbound_method: str = Query("debit_card"),
    outbound_method: str = Query("visa_direct")
):
    try:
        # 1. Sandbox/Limit Logic (Simplified for now)
        # In a real app, we check user tier. Here, we just check amount.
        limit_exceeded = False # Default
        if amount > 190: # Mock limit
             limit_exceeded = True

        # 2. Currency Validation (Dynamic)
        valid_currencies = get_config_currencies()
        if currency_from not in valid_currencies or currency_to not in valid_currencies:
             raise ValueError(f"Unsupported currency pair: {currency_from}->{currency_to}")

        # 3. Get Quote from Controller
        quote = controller.get_authorization_quote(
            amount_send=amount, # Controller expects float
            currency_from=currency_from,
            currency_to=currency_to,
            mid_market_rate=rate,
            payment_method=inbound_method,
            outbound_method=outbound_method
        )
        
        # 3.1 Least-Cost Routing & Friction Engine
        from ..logic.fee_calculator import FeeCalculator
        
        currency_map = {
            "MXN": "MX", "ARS": "AR", "COP": "CO", "GTQ": "GT", 
            "DOP": "DR", "GHS": "GH", "NGN": "NG", "EUR": "ES", "USD": "US"
        }
        dest_country = currency_map.get(currency_to)
        source_country = currency_map.get(currency_from)
        
        if dest_country and source_country:
            # LCR Suggestion
            lcr_options = FeeCalculator.calculate_best_route(dest_country, amount, currency_to)
            if lcr_options:
                quote['recommended_rail'] = lcr_options[0]
            
            # Friction Breakdown (Sacred Amount)
            try:
                friction_data = FeeCalculator.calculate_friction(
                    source_country=source_country,
                    dest_country=dest_country,
                    amount_principal=amount,
                    inbound_method=inbound_method,
                    outbound_method=outbound_method
                )
                quote['friction_breakdown'] = friction_data
                quote['total_user_cost'] = friction_data['gross_payment_amount']
            except Exception as e:
                print(f"[Warning] Friction calc failed: {e}")
                quote['friction_breakdown'] = {"error": str(e)}
        
        # 4. Inject Limit Status
        if limit_exceeded:
            quote['limit_exceeded'] = True
            quote['limit_reason'] = "Sandbox trial limit is €190 derived."

        return quote

    except Exception as e:
        # Print full traceback to terminal for debugging
        print(f"!!! Error in /quotes/transparent: {str(e)}")
        traceback.print_exc()
        
        # Return proper HTTP error
        if isinstance(e, ValueError):
             raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error: Quote calculation failed.")
