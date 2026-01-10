import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import text
import bcrypt
from backend.database import SessionLocal

router = APIRouter()

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
        existing_user_sql = text("SELECT trueque_id FROM users WHERE email = :email")
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
        trueque_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())

        insert_sql = text("""
            INSERT INTO users (
                id, trueque_id, email, password_hash, 
                first_name, last_name, dob, 
                country_of_residence, country_destiny, address, 
                created_at
            )
            VALUES (
                :id, :trueque_id, :email, :password_hash,
                :first_name, :last_name, :dob,
                :country_of_residence, :country_destiny, :address,
                :created_at
            )
        """)

        db.execute(insert_sql, {
            "id": user_id,
            "trueque_id": trueque_id,
            "email": payload.email,
            "password_hash": password_hash,
            "first_name": payload.first_name,
            "last_name": payload.last_name,
            "dob": payload.dob,
            "country_of_residence": payload.country_of_residence,
            "country_destiny": payload.country_destiny,
            "address": payload.address,
            "created_at": datetime.now(timezone.utc)
        })
        db.commit()

        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "status": "ok",
                "trueque_id": trueque_id,
                "message": "User created successfully"
            }
        )
    except Exception as e:
        db.rollback()
        print(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
