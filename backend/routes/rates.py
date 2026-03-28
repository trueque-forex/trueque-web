from fastapi import APIRouter, HTTPException
from backend.services.fx_consensus import FXConsensusService
import datetime

router = APIRouter()

@router.get("/rates")
async def get_exchange_rate(from_currency: str, to_currency: str):
    """
    Returns the Truth Rate (Consensus Median) from OANDA/Chainlink/Fixer.
    """
    try:
        # Get consensus from the Engine
        rate, is_unstable = FXConsensusService.get_consensus_rate(from_currency, to_currency)
        
        return {
            "rate": rate,
            "is_unstable": is_unstable,
            "timestamp": datetime.datetime.now().isoformat(),
            "engine": "OANDA-CHAINLINK-FIXER TRIO"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
