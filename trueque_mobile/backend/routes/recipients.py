from fastapi import APIRouter, HTTPException
from sqlalchemy import insert, select
from backend.models.models import recipient_profiles
from backend.database import engine

router = APIRouter()

@router.post("/recipients")
async def create_recipient(payload: dict):
    with engine.connect() as conn:
        result = conn.execute(insert(recipient_profiles).values(**payload))
        conn.commit()
    return {"message": "Recipient created", "id": result.inserted_primary_key[0]}

@router.get("/recipients")
async def list_recipients():
    with engine.connect() as conn:
        result = conn.execute(select(recipient_profiles))
        rows = [dict(row._mapping) for row in result]
    return {"recipients": rows}