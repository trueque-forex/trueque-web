
import hmac
import hashlib
import json
from typing import Dict, Any, Tuple, List, Optional
from fastapi import APIRouter, Request, Header, HTTPException, BackgroundTasks
from ..services.compliance_assistant import ComplianceAssistant

router = APIRouter(prefix="/api/compliance", tags=["Compliance"])

# Secret should be in env vars. Mocking for MVP.
FLAGRIGHT_WEBHOOK_SECRET = "sk_live_mock_flagright_secret_123"

def verify_signature(payload: bytes, signature: str) -> bool:
    if not signature:
        return False
    
    # Compute HMAC-SHA256
    computed = hmac.new(
        FLAGRIGHT_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(computed, signature)

@router.post("/webhook/flagright")
async def flagright_webhook(
    request: Request, 
    background_tasks: BackgroundTasks,
    x_flagright_signature: str = Header(None)
):
    """
    Receives AML/Sanctions alerts from Flagright.
    Must respond 200 OK immediately.
    """
    payload_bytes = await request.body()
    
    # 1. Security Verification
    if not verify_signature(payload_bytes, x_flagright_signature):
        print(f"[Security] Invalid Webhook Signature: {x_flagright_signature}")
        raise HTTPException(status_code=401, detail="Invalid Signature")
        
    # 2. Parse Payload
    try:
        data = json.loads(payload_bytes)
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
        
    event_type = data.get("type")
    
    # 3. Process Specific Events
    if event_type == "TRANSACTION_MONITORING_RULE_TRIGGERED":
        # Offload to background task to ensure fast 200 response
        background_tasks.add_task(ComplianceAssistant.investigate_alert, data)
        
    return {"status": "received"}
