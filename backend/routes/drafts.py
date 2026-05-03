from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from ..models.draft_model import Draft
from ..controllers.draft_controller import DraftController
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/api/drafts", tags=["Drafts"])
controller = DraftController()

# Schema for incoming draft data
class DraftCreate(BaseModel):
    user_id: str
    step: str
    data: Dict[str, Any]

class DraftPromote(BaseModel):
    draft_id: str
    user_id: str

@router.get("/active")
def get_active_draft_check(user_id: str = Query(...), db: Session = Depends(get_db)):
    """
    Checks if the user has an active draft (Status='active').
    Returns { found: bool, draft_id: str, step: str }
    """
    draft = controller.get_active_draft(user_id, db)
    if draft:
        return {
            "found": True,
            "draft_id": draft.id,
            "step": draft.step,
            "data": draft.data,
            "updated_at": draft.updated_at
        }
    return {"found": False}

@router.post("/create")
def create_new_draft(payload: Dict[str, str], db: Session = Depends(get_db)):
    """
    Creates a fresh draft.
    Payload: { "user_id": "..." }
    """
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id required")
        
    # Optional: Archive existing active drafts?
    # For now, per logic, we just create new. 
    # The Frontend logic is responsible for checking /active first.
    
    draft = controller.create_draft(user_id, {}, db)
    return {"ok": True, "draft_id": draft.id, "step": draft.step}

@router.post("/")
def save_draft(draft_in: DraftCreate, db: Session = Depends(get_db)):
    # Legacy/Direct Save - effectively an update or create
    # We can use update_draft if we have ID, but this endpoint seems to be "Save State"
    # If ID is not in payload (it's not in DraftCreate), how do we know which to update?
    # The current implementation created a NEW draft every time.
    # We should encourage using ID.
    
    # For backward compatibility / robust saving:
    # If we find an active draft for this user, UPDATE it.
    draft = controller.get_active_draft(draft_in.user_id, db)
    if draft:
        controller.update_draft(draft.id, draft_in.user_id, draft_in.data, draft_in.step, db)
        return {"ok": True, "draft_id": draft.id, "message": "Draft updated"}
    
    # Else create new
    new_draft = controller.create_draft(draft_in.user_id, draft_in.data, db)
    # Update step if needed (create_draft sets 'initial')
    new_draft.step = draft_in.step
    db.commit()
    
    return {"ok": True, "draft_id": new_draft.id, "message": "Draft saved"}

@router.put("/{draft_id}")
def update_draft_endpoint(draft_id: str, payload: DraftCreate, db: Session = Depends(get_db)):
    draft = controller.update_draft(draft_id, payload.user_id, payload.data, payload.step, db)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {"ok": True, "draft_id": draft.id, "message": "Draft updated"}

@router.get("/{user_id}")
def get_user_drafts(user_id: str, db: Session = Depends(get_db)):
    drafts = db.query(Draft).filter(
        Draft.user_id == user_id, 
        Draft.status == "active"
    ).order_by(Draft.updated_at.desc()).all()
    return drafts

@router.post("/promote")
def promote_draft_to_transaction(payload: DraftPromote, db: Session = Depends(get_db)):
    draft = db.query(Draft).filter(Draft.id == payload.draft_id, Draft.user_id == payload.user_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
        
    if draft.status != "active":
         raise HTTPException(status_code=400, detail="Draft is already converted or abandoned")

    # Lock it
    draft.status = "converted"
    draft.updated_at = datetime.utcnow()
    db.commit()
    
    return {"ok": True, "data": draft.data, "message": "Draft unlocked for conversion"}

@router.delete("/{draft_id}")
def delete_draft(draft_id: str, db: Session = Depends(get_db)):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if draft:
        db.delete(draft)
        db.commit()
    return {"ok": True}
