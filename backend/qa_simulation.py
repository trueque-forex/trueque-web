# Run this with: python -m backend.qa_simulation
from backend.services.fee_orchestrator import FeeOrchestrator

def run_qa_simulation():
    orchestrator = FeeOrchestrator()
    
    # 1. Setup Environment
    market_rate = 1150.0 
    user_intent_eur = 105.0
    
    with open("qa_report.txt", "w", encoding="utf-8") as f:
        f.write(f"--- QA MODE: Simulation Initiated ---\n")
        f.write(f"User Intent: {user_intent_eur} EUR\n")
        f.write(f"Market Rate: {market_rate} ARS/EUR\n")
        f.write(f"Implied User Intent in ARS: {user_intent_eur * market_rate:,.2f} ARS\n")
        f.write("-" * 40 + "\n")

        # 2. Simulate 10 Pending Offers
        offers_ars = [100000] * 5 + [200000] * 3 + [500000] * 2
        f.write(f"Simulating {len(offers_ars)} Pending Offers in Argentina (ARS amounts):\n")
        f.write(f"Values: {sorted(list(set(offers_ars)))}\n")
        f.write("-" * 40 + "\n")

        # 3. Fuzzy Matching Logic
        unique_offers = sorted(list(set(offers_ars)))
        distances = [(offer, abs(offer - (user_intent_eur * market_rate))) for offer in unique_offers]
        distances.sort(key=lambda x: x[1])
        
        closest_matches_ars = [distances[0][0], distances[1][0]]
        closest_matches_ars.sort()

        f.write(f"Top 2 Closest Matches found:\n")
        
        for i, match_ars in enumerate(closest_matches_ars):
            principal_eur = match_ars / market_rate
            bracket = 0 
            
            quote = orchestrator.get_transparent_quote(
                amount_send=principal_eur,
                currency_from="EUR",
                currency_to="ARS",
                mid_market_rate=market_rate,
                country_from="ES",
                country_to="AR",
                tier="T1",
                settlement_bracket=bracket
            )
            
            total_paid_eur = quote['total_cost_to_sender']
            eer = match_ars / total_paid_eur
            
            f.write(f"\nMatch #{i+1}: {match_ars:,.0f} ARS (approx {principal_eur:.2f} EUR)\n")
            f.write(f"  > Settlement: Rocket (0d)\n")
            f.write(f"  > Principal: {principal_eur:.2f} EUR\n")
            f.write(f"  > Total Friction: {quote['total_friction_value']:.2f} EUR\n")
            f.write(f"  > Total Cost (User Pays): {total_paid_eur:.2f} EUR\n")
            f.write(f"  > EER (Truth Rate): 1 EUR = {eer:.4f} ARS\n")

if __name__ == "__main__":
    run_qa_simulation()
