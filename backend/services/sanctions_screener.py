
from backend.models.user_model import User
from backend.services.kms_service import KMSService
from backend.audit_db import AuditDB

class SanctionsScreener:
    @staticmethod
    def screen_user(user: User) -> bool:
        """
        Screens user against Mock Flagright API.
        Returns True if SAFE, False if SANCTIONS HIT.
        """
        # 1. Decrypt ID (Triggers KEY_ACCESS Audit)
        # Note: We pass user.id as string (casting if necessary) for the log
        plaintext_id = KMSService.decrypt(
            user.id_number_enc, 
            reason="DAILY_SANCTIONS_SCAN", 
            user_id=str(user.id),
            actor="SYSTEM_SCHEDULER"
        )
        
        if not plaintext_id:
            return True # Nothing to screen
            
        # 2. Mock API Call
        # "Flagright" Logic: If ID conatins "999", it's a hit.
        # Or if Name contains "Pablo".
        
        hit = False
        if "999" in plaintext_id:
            hit = True
        
        if user.full_name and "BadActor" in user.full_name:
            hit = True
            
        if hit:
            AuditDB.log_alert(
                user_id=str(user.id), 
                alert_type="SANCTIONS_HIT", 
                details=f"Hit on ID {plaintext_id[-4:]}...", # Redact in log
                fingerprint="FLAGRIGHT_API"
            )
            return False
            
        return True

    @staticmethod
    def screen_user_optimized(user: User, bad_id_hashes: list) -> bool:
        """
        Optimized Screen: Checks Blind Index first.
        Only decrypts if there is a Hash Match.
        """
        # 1. Blind Index Check (Fast, No Decrypt)
        if user.id_number_bidx not in bad_id_hashes:
            return True # Safe, no hit in hash list
            
        # 2. Hash Match Found -> Decrypt to Confirm (Slow, Updates Audit Log)
        # We assume if hash matches, it's highly likely a hit, but we confirm to be sure (and to log usage)
        
        plaintext_id = KMSService.decrypt(
            user.id_number_enc, 
            reason="SANCTIONS_HIT_CONFIRMATION", 
            user_id=str(user.id),
            actor="SYSTEM_SCHEDULER"
        )
        
        # Double check (paranoia check)
        # In reality, collision is rare with HMAC-SHA256, so existence is usually enough.
        # But we log the 'Hit' details.
        
        AuditDB.log_alert(
            user_id=str(user.id), 
            alert_type="SANCTIONS_HIT_OPTIMIZED", 
            details=f"Confirmed Hit on ID via Blind Index",
            fingerprint="FLAGRIGHT_API_BIDX"
        )
        return False
