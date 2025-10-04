from models import AuditLog

def log_action(actor_uuid: str, action: str, db: Session):
    log = AuditLog(
        actor_uuid=actor_uuid,
        action=action,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()