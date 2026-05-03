import sys
import os
import asyncio
from decimal import Decimal

# Add parent dir to path so backend module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.api.v1.quotes import compare_quotes, CompareQuoteRequest

async def run_master_build_test():
    print("Executing Final Phase 2 Master Build API Test...")
    
    # 1. $1000 request
    request = CompareQuoteRequest(
        principal=Decimal('1000.00'),
        currency_from='USD',
        currency_to='MXN',
        mid_market_rate=Decimal('20.00')
    )
    
    # 2. Call the 'Smart Quote' API
    response = await compare_quotes(request)
    
    rtp_total = response.p2p_rtp['total_to_pay']
    card_total = response.p2p_card['total_to_pay']
    
    print("\n================= SMART QUOTES =================")
    print(f"RTP Match Total:  ${rtp_total:,.2f}")
    print(f"CARD Match Total: ${card_total:,.2f}")
    print("================================================")
    print("Trust Badges Included in Payload:")
    for badge in response.trust_badges:
        print(f" 🛡️  {badge}")
    print("================================================\n")
    
    assert rtp_total == 1016.00, f"Expected RTP $1016.00, got {rtp_total}"
    assert card_total == 1040.00, f"Expected CARD $1040.00, got {card_total}"
    assert len(response.trust_badges) == 4, "Missing Trust Badges"
    
    print("✅ MASTER BUILD VERIFIED. ALL ASSERTIONS PASSED.")

if __name__ == "__main__":
    asyncio.run(run_master_build_test())
