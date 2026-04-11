from backend.database import SessionLocal, engine
from backend.models.user_model import User

def test_orm_insert():
    db = SessionLocal()
    try:
        user = User(
            id="test-orm-uuid",
            email="test-orm@test.com",
            trueque_id="T0002",
            first_name="TestORM",
            # We must ensure we provide values consistent with table
        )
        db.add(user)
        db.commit()
        print("ORM Insert Success")
    except Exception as e:
        print("ORM Insert Failed:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_orm_insert()
