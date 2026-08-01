import uuid
import random
import re
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text
import bcrypt
from backend.database import SessionLocal

router = APIRouter()


def _generate_symmetri_id(first_name: str, last_name: str, db) -> str:
    """
    Generate a unique @handle in the format @firstlast####.
    GEMINI.md §2.1 — symmetri_id must start with '@'.
    Strips non-alpha characters, lowercases, appends 4 random digits.
    Retries up to 10 times to guarantee uniqueness.
    """
    base = re.sub(r"[^a-z]", "", f"{first_name}{last_name}".lower())
    if not base:
        base = "user"
    for _ in range(10):
        handle = f"@{base}{random.randint(1000, 9999)}"
        existing = db.execute(
            text("SELECT 1 FROM users WHERE symmetri_id = :sid"),
            {"sid": handle}
        ).fetchone()
        if not existing:
            return handle
    # Final fallback: append uuid4 suffix — guaranteed unique
    return f"@{base}{str(uuid.uuid4())[:8]}"

class WebSignupPayload(BaseModel):
    first_name: str
    last_name: str
    dob: str
    email: str
    password: str
    country_of_residence: str
    country_destiny: str
    address: str | None = None

@router.post("/auth/signup")
def web_signup(payload: WebSignupPayload):
    db = SessionLocal()
    try:
        # Check if email exists
        existing_user_sql = text("SELECT symmetri_id FROM users WHERE email = :email")
        res = db.execute(existing_user_sql, {"email": payload.email})
        if res.fetchone():
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "status": "error",
                    "message": "Email already registered"
                }
            )

        # Hash password
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(payload.password.encode('utf-8'), salt).decode('utf-8')

        # Generate IDs
        # symmetri_id: @handle per GEMINI.md §2.1 (must start with '@')
        symmetri_id = _generate_symmetri_id(payload.first_name, payload.last_name, db)
        user_id = str(uuid.uuid4())

        insert_sql = text("""
            INSERT INTO users (
                id, symmetri_id, email, password_hash,
                first_name, last_name, dob,
                country_of_residence, country_destiny, address,
                kyc_status, user_type,
                created_at
            )
            VALUES (
                :id, :symmetri_id, :email, :password_hash,
                :first_name, :last_name, :dob,
                :country_of_residence, :country_destiny, :address,
                :kyc_status, :user_type,
                :created_at
            )
        """)

        db.execute(insert_sql, {
            "id": user_id,
            "symmetri_id": symmetri_id,
            "email": payload.email,
            "password_hash": password_hash,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "dob": payload.dob,
            "country_of_residence": payload.country_of_residence,
            "country_destiny": payload.country_destiny,
            "address": payload.address,
            # GEMINI.md §2.1 — new users start at EMPTY, not PENDING
            "kyc_status": "EMPTY",
            "user_type": "PEER",
            "created_at": datetime.now(timezone.utc),
        })
        db.commit()

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "status": "ok",
                "symmetri_id": symmetri_id,
                "message": "User created successfully"
            }
        )
    except Exception as e:
        db.rollback()
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
