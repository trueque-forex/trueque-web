import uuid
from datetime import datetime, timezone
import bcrypt
from sqlalchemy import text
from backend.database import SessionLocal

def seed_hustle():
    db = SessionLocal()
    try:
        email = "hustle@symmetri.com"
        
        # Check if exists
        check_sql = text("SELECT id FROM users WHERE email = :email")
        res = db.execute(check_sql, {"email": email}).fetchone()
        if res:
            print(f"User {email} already exists. Deleting to ensure clean slate.")
            del_sql = text("DELETE FROM users WHERE email = :email")
            db.execute(del_sql, {"email": email})
            db.commit()

        # Hash password
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw("Hustle2026!".encode('utf-8'), salt).decode('utf-8')

        symmetri_id = "@hustle" + str(uuid.uuid4())[:4]
        user_id = str(uuid.uuid4())

        insert_sql = text("""
            INSERT INTO users (
                id, symmetri_id, email, password_hash,
                first_name, last_name, dob,
                kyc_status, user_type,
                created_at
            )
            VALUES (
                :id, :symmetri_id, :email, :password_hash,
                :first_name, :last_name, :dob,
                :kyc_status, :user_type,
                :created_at
            )
        """)

        db.execute(insert_sql, {
            "id": user_id,
            "symmetri_id": symmetri_id,
            "email": email,
            "password_hash": password_hash,
            "first_name": "Hustle",
            "last_name": "Fund",
            "dob": "1990-01-01",
            "kyc_status": "EMPTY",
            "user_type": "PEER",
            "created_at": datetime.now(timezone.utc),
        })
        db.commit()
        print(f"Successfully seeded {email} with a clean slate.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_hustle()
