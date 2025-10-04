from fastapi import APIRouter
import httpx

router = APIRouter()

@router.get("/rates")
async def get_exchange_rate(from_currency: str, to_currency: str):
    url = f"https://api.exchangerate.host/convert?from={from_currency}&to={to_currency}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
        return {
            "rate": data["result"],
            "timestamp": data["date"]  # ISO format like "2025-09-25"

}