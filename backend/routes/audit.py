from models import AuditLog
from datetime import datetime, timezone

def log_action(actor_uuid: str, action: str, db: Session):
    log = AuditLog(
        actor_uuid=actor_uuid,
        action=action,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(log)
    db.commit()