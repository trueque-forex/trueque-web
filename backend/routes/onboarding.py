# trueque_mobile/backend/routes/onboarding.py

import os
from datetime import date
from fastapi import APIRouter

router = APIRouter()

def read_today_audit_log(corridor_id="MX-US"):
    today = date.today().isoformat()  # YYYY-MM-DD
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

@router.get("/onboarding/audit-log")
def get_audit_log(corridor: str = "MX-US"):
    return read_today_audit_log(corridor)