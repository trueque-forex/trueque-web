from backend.database import SessionLocal
from backend.models.user_model import User
from backend.utils.pin_utils import hash_pin

db = SessionLocal()

# Check if user already exists
existing_user = db.query(User).filter(User.id == 2).first()
if existing_user:
    print("⚠️ User with ID 2 already exists.")
else:
    test_user = User(
        id=2,
        email="test@example.com",
        country="CO",
        pin_hash=hash_pin("1234")
    )
    db.add(test_user)
    db.commit()
    print("✅ Test user inserted.")

db.close()