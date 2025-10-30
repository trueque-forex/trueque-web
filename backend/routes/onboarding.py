<<<<<<< HEAD
# trueque_mobile/backend/routes/onboarding.py

import os
from datetime import date
from fastapi import APIRouter

router = APIRouter()

def read_today_audit_log(corridor_id="MX-US"):
    today = date.today().isoformat()  # YYYY-MM-DD
=======
import os
import uuid
from datetime import date, datetime
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, validator
from sqlalchemy import text
from backend.init_db import SessionLocal

router = APIRouter()


def read_today_audit_log(corridor_id: str = "BR-US"):
    today = date.today().isoformat()
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    filename = f"match_audit_{corridor_id}_{today}.log"
    log_path = os.path.join(os.path.dirname(__file__), "../../protocol/audit", filename)

    if not os.path.exists(log_path):
        return {
            "status": "no_log",
            "message": f"No audit log found for {corridor_id} on {today}"
        }

    with open(log_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        entries = [line.strip() for line in lines if line.strip()]
        return {
            "status": "ok",
            "corridor": corridor_id,
            "date": today,
            "entries": entries
        }

<<<<<<< HEAD
@router.get("/onboarding/audit-log")
def get_audit_log(corridor: str = "MX-US"):
    return read_today_audit_log(corridor)
=======

@router.get("/onboarding/audit-log")
def get_audit_log(corridor: str = "BR-US"):
    return read_today_audit_log(corridor)


class SignupPayload(BaseModel):
    phone: str
    pin: str
    corridor: str = "BR-US"

    @validator("pin")
    def pin_must_be_numeric_and_4_digits(cls, v: str):
        if not v.isdigit():
            raise ValueError("PIN must be numeric")
        if len(v) != 4:
            raise ValueError("PIN must be exactly 4 digits")
        return v

    @validator("phone")
    def phone_format(cls, v: str):
        if not v.startswith("+") or not v[1:].isdigit():
            raise ValueError("Phone must start with '+' followed by digits")
        if not (10 <= len(v[1:]) <= 15):
            raise ValueError("Phone must contain between 10 and 15 digits after '+'")
        return v


def write_signup_log(phone_number: str, trueque_id: str, corridor: str = "BR-US"):
    today = date.today().isoformat()
    filename = f"signup_log_{corridor}_{today}.log"
    log_dir = os.path.join(os.path.dirname(__file__), "../../protocol/audit")
    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, filename)
    timestamp = datetime.utcnow().isoformat()
    line = f"{timestamp} | {corridor} | {phone_number} | {trueque_id}\n"
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(line)


@router.post("/signup")
def signup(payload: SignupPayload):
    """
    Atomic upsert using INSERT ... ON CONFLICT.
    - Ensures id is generated via gen_random_uuid() at insert time.
    - Supplies a stable placeholder email to satisfy NOT NULL email constraint.
    - Returns 201 when a new row was created, 200 when an existing user is returned.
    """
    db = SessionLocal()
    try:
        trueque_id = str(uuid.uuid4())
        # Placeholder email pattern so NOT NULL constraint is satisfied for phone-first flows
        placeholder_email = f"phone+{payload.phone.replace('+','')}@noemail.trueque"

        upsert_sql = text("""
            INSERT INTO users (id, phone_number, trueque_id, created_at, email)
            VALUES (gen_random_uuid(), :phone_number, :trueque_id, now(), :email)
            ON CONFLICT (phone_number)
            DO UPDATE SET phone_number = users.phone_number
            RETURNING trueque_id AS returned_trueque_id, (xmax = 0) AS inserted;
        """)

        res = db.execute(upsert_sql, {
            "phone_number": payload.phone,
            "trueque_id": trueque_id,
            "email": placeholder_email
        })
        db.commit()

        row = res.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unexpected DB response")

        # Handle both RowMapping (named access) and positional tuple results
        if hasattr(row, "keys"):
            returned_id = row["returned_trueque_id"]
            was_inserted = bool(row["inserted"])
        else:
            # Order corresponds to RETURNING trueque_id AS returned_trueque_id, (xmax = 0) AS inserted
            returned_id = row[0]
            was_inserted = bool(row[1])

        write_signup_log(payload.phone, returned_id, corridor=payload.corridor)

        if was_inserted:
            return JSONResponse(
                status_code=status.HTTP_201_CREATED,
                content={
                    "status": "ok",
                    "trueque_id": returned_id,
                    "message": f"User with phone {payload.phone} created"
                }
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "ok",
                "trueque_id": returned_id,
                "message": f"User with phone {payload.phone} already exists — returned existing trueque_id"
            }
        )
    finally:
        db.close()
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
