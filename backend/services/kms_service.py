
import base64
from backend.audit_db import AuditDB

class KMSService:
    """
    Mock Key Management Service for AES-256 Encryption.
    In production, this would interface with AWS KMS or HashiCorp Vault.
    """
    
    # Mock Key (In prod, this never touches app code directly)
    _MOCK_KEY = b'YELLOW SUBMARINE' 
    _BLIND_INDEX_SALT = b'PEPPER_AND_SALT_FOR_HASHING'

    @staticmethod
    def get_blind_index(plaintext: str) -> str:
        """
        Computes a deterministic HMAC-SHA256 hash for exact-match searching.
        This allows searching for PII (e.g. SSN) without decrypting every row.
        """
        import hmac
        import hashlib
        
        if not plaintext: return None
        
        # HMAC-SHA256
        h = hmac.new(KMSService._BLIND_INDEX_SALT, plaintext.encode(), hashlib.sha256)
        return h.hexdigest()

    @staticmethod
    def encrypt(plaintext: str) -> str:
        """
        Encrypts PII.
        For MVP, we just base64 encode and prefix with 'ENC_'.
        In Prod: AES-256-GCM.
        """
        if not plaintext: return None
        encoded = base64.b64encode(plaintext.encode()).decode()
        return f"ENC_{encoded}"

    @staticmethod
    def decrypt(ciphertext: str, reason: str, user_id: str, actor: str = "SYSTEM") -> str:
        """
        Decrypts PII and LOGS THE ACCESS.
        """
        if not ciphertext: return None
        
        # 1. Audit Log (Mandatory)
        # We assume AuditDB init is handled globally or we init here to be safe
        AuditDB.init_db()
        AuditDB.log_alert(
            user_id=user_id,
            alert_type="KEY_ACCESS",
            details=f"Decryption requested by {actor}. Reason: {reason}",
            fingerprint="INTERNAL_KMS" 
        )
        
        # 2. Decrypt
        if ciphertext.startswith("ENC_"):
            clean = ciphertext[4:]
            try:
                decoded = base64.b64decode(clean).decode()
                return decoded
            except:
                return "[Error: Decryption Failed]"
        return ciphertext # Return as-is if not encrypted (migration scenario)
