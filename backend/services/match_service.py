import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from decimal import Decimal

from sqlalchemy.orm import Session

from backend.common.errors import TruequeError, ErrorCode
from backend.models.match_model import Match

# Helper to load config
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'corridor_config.json')

def get_corridor_config():
    with open(CONFIG_PATH, 'r') as f:
        return json.load(f)


class MatchService:
    """
    DB-backed P2P Match Service.
    All match state is persisted to the 'matches' table — no in-memory data.
    """

    def create_match(
        self,
        db: Session,
        user_a_id: str,
        amount: float,
        source_currency: str,
        target_currency: str = None,
        exchange_rate: float = None,
        user_b_id: str = None,
    ) -> Match:
        """Create a new P2P match record in the database."""
        match = Match(
            id=uuid.uuid4(),
            status="CREATED",
            user_a_id=uuid.UUID(str(user_a_id)),
            user_b_id=uuid.UUID(str(user_b_id)) if user_b_id else None,
            user_a_status="PENDING_FUNDING",
            user_b_status="PENDING_FUNDING",
            amount=Decimal(str(amount)),
            source_currency=source_currency,
            target_currency=target_currency,
            exchange_rate=Decimal(str(exchange_rate)) if exchange_rate else None,
            payouts_triggered=False,
            rate_locked_at=datetime.now(timezone.utc),
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        return match

    def get_match(self, db: Session, match_id: str) -> Optional[Match]:
        """Fetch a match by its UUID."""
        return db.query(Match).filter(Match.id == uuid.UUID(str(match_id))).first()

    def update_funding_status(self, db: Session, match_id: str, role: str, status: str) -> Match:
        """Update the funding status for user_a or user_b."""
        match = self.get_match(db, match_id)
        if not match:
            raise TruequeError(ErrorCode.RESOURCE_NOT_FOUND, f"Match {match_id} not found", 404)

        if role == 'user_a':
            match.user_a_status = status
        elif role == 'user_b':
            match.user_b_status = status
        else:
            raise TruequeError(ErrorCode.VALIDATION_ERROR, f"Invalid role '{role}'. Must be 'user_a' or 'user_b'.", 400)

        match.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(match)
        return match

    def is_dual_funded(self, db: Session, match_id: str) -> bool:
        """Returns True only when both participants have confirmed funding."""
        match = self.get_match(db, match_id)
        if not match:
            return False
        return match.user_a_status == "FUNDED" and match.user_b_status == "FUNDED"

    def check_rate_lock_expiry(self, db: Session, match_id: str, window_minutes: int) -> bool:
        """Returns True if the rate lock window has expired."""
        match = self.get_match(db, match_id)
        if not match or not match.rate_locked_at:
            return False
        delta = datetime.now(timezone.utc) - match.rate_locked_at.replace(tzinfo=timezone.utc)
        return delta > timedelta(minutes=window_minutes)

    def release_match(self, db: Session, match_id: str):
        """Mark an expired match as released."""
        match = self.get_match(db, match_id)
        if match:
            match.status = "EXPIRED_RELEASED"
            match.updated_at = datetime.now(timezone.utc)
            db.commit()

    def mark_payouts_triggered(self, db: Session, match_id: str):
        """Mark that payouts have been dispatched for this match."""
        match = self.get_match(db, match_id)
        if match:
            match.payouts_triggered = True
            match.status = "COMPLETED"
            match.updated_at = datetime.now(timezone.utc)
            db.commit()

