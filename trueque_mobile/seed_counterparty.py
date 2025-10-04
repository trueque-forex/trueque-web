from backend.database import SessionLocal
from backend.models.advance_model import Advance
from datetime import datetime

db = SessionLocal()

counterparty = Advance(
    user_id=3,
    uuid="abc123",
    country="CO",
    currency_from="COP",
    currency_to="USD",
    amount_from=100000,
    amount_to=25,
    amount=25,
    market_rate=4000,
    created_at=datetime.utcnow()
)

db.add(counterparty)
db.commit()
db.close()

print("✅ Counterparty advance seeded.")