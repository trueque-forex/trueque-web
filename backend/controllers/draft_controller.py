
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.draft_model import Draft
from ..models.transaction import Transaction
from datetime import datetime

class DraftController:
    """
    Manages the lifecycle of Draft Transactions (Intent Tracking).
    """

    def get_active_draft(self, user_id: str, db: Session) -> Optional[Draft]:
        """
        Finds the most recent 'active' draft for the user.
        """
        return db.query(Draft).filter(
            Draft.user_id == user_id,
            Draft.status == 'active'
        ).order_by(Draft.updated_at.desc()).first()

    def create_draft(self, user_id: str, initial_data: Dict[str, Any], db: Session) -> Draft:
        """
        Creates a new draft. 
        If an active draft exists, should we archive it? 
        For now, we simply create a new one (prompt says 'create a new transaction record').
        """
        # Optional: Archive old active drafts to enforcing "One Active Draft" rule
        # old_drafts = db.query(Draft).filter(Draft.user_id == user_id, Draft.status == 'active').all()
        # for d in old_drafts:
        #     d.status = 'abandoned'
        
        # Create New
        new_draft = Draft(
            user_id=user_id,
            step="initial",
            data=initial_data,
            status="active",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_draft)
        db.commit()
        db.refresh(new_draft)
        return new_draft

    def update_draft(self, draft_id: str, user_id: str, data: Dict[str, Any], step: str, db: Session) -> Optional[Draft]:
        draft = db.query(Draft).filter(Draft.id == draft_id, Draft.user_id == user_id).first()
        if not draft:
            return None
        
        # Merge data
        if draft.data:
            current_data = dict(draft.data)
            current_data.update(data)
            draft.data = current_data
        else:
            draft.data = data
            
        draft.step = step
        draft.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(draft)
        return draft
