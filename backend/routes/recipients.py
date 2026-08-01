# backend/routes/recipients.py
from fastapi import APIRouter, HTTPException
from sqlalchemy import insert, select
from backend.models.recipient_profile import RecipientProfile
from backend.database import engine

router = APIRouter()

# Use RecipientProfile.__table__ so SQLAlchemy Core insert/select statements
# work identically to before — no behaviour change, just ORM-backed table reference.
_table = RecipientProfile.__table__


@router.post("/recipients")
async def create_recipient(payload: dict):
    try:
        with engine.connect() as conn:
            result = conn.execute(insert(_table).values(**payload))
            conn.commit()
        return {"message": "Recipient created", "id": result.inserted_primary_key[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recipients")
async def list_recipients():
    try:
        with engine.connect() as conn:
            result = conn.execute(select(_table))
            rows = [dict(row._mapping) for row in result]
        return {"recipients": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))