import os
import base64
import hmac
import hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from backend.audit_db import AuditDB

class KMSService:
    """
    Key Management Service for AES-256-GCM Encryption.
    Uses APP_ENCRYPTION_KEY from environment. In production this
    key would be fetched from AWS KMS or HashiCorp Vault at startup.
    """

    @staticmethod
    def _get_key() -> bytes:
        """Load and decode the 32-byte AES key from the environment."""
        raw = os.environ.get("APP_ENCRYPTION_KEY", "")
        if not raw:
            raise RuntimeError("APP_ENCRYPTION_KEY is not set. Cannot encrypt PII.")
        try:
            key = base64.b64decode(raw)
        except Exception:
            key = raw.encode()
        # AES-256 requires exactly 32 bytes
        if len(key) < 32:
            key = key.ljust(32, b'\0')
        return key[:32]

    @staticmethod
    def _get_blind_salt() -> bytes:
        raw = os.environ.get("BLIND_INDEX_SALT", "symmetri_blind_search_salt_2026_xyz")
        return raw.encode()

    @staticmethod
    def get_blind_index(plaintext: str) -> str:
        """
        Computes a deterministic HMAC-SHA256 hash for exact-match searching.
        Allows searching for PII (e.g. SSN) without decrypting every row.
        """
        if not plaintext:
            return None
        h = hmac.new(KMSService._get_blind_salt(), plaintext.encode(), hashlib.sha256)
        return h.hexdigest()

    @staticmethod
    def encrypt(plaintext: str) -> str:
        """
        Encrypts PII using AES-256-GCM.
        Returns a base64-encoded string prefixed with 'ENC2_' to distinguish
        from old base64-only 'ENC_' records (migration-safe).
        """
        if not plaintext:
            return None
        key = KMSService._get_key()
        aesgcm = AESGCM(key)
        # 12-byte random nonce (standard for GCM)
        nonce = os.urandom(12)
        ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
        # Store nonce + ciphertext together, base64 encoded
        blob = base64.b64encode(nonce + ciphertext).decode()
        return f"ENC2_{blob}"

    @staticmethod
    def decrypt(ciphertext: str, reason: str, user_id: str, actor: str = "SYSTEM") -> str:
        """
        Decrypts PII and logs the access for audit trail.
        Handles both old ENC_ (base64 only) and new ENC2_ (AES-GCM) formats.
        """
        if not ciphertext:
            return None

        # Mandatory audit log
        AuditDB.init_db()
        AuditDB.log_alert(
            user_id=user_id,
            alert_type="KEY_ACCESS",
            details=f"Decryption requested by {actor}. Reason: {reason}",
            fingerprint="INTERNAL_KMS"
        )

        # New AES-256-GCM format
        if ciphertext.startswith("ENC2_"):
            try:
                key = KMSService._get_key()
                blob = base64.b64decode(ciphertext[5:])
                nonce, encrypted = blob[:12], blob[12:]
                aesgcm = AESGCM(key)
                return aesgcm.decrypt(nonce, encrypted, None).decode()
            except Exception:
                return "[Error: Decryption Failed]"

        # Legacy base64-only format (ENC_ prefix) — migration compatibility
        if ciphertext.startswith("ENC_"):
            try:
                return base64.b64decode(ciphertext[4:]).decode()
            except Exception:
                return "[Error: Legacy Decryption Failed]"

        # Unencrypted value (pre-encryption migration scenario)
        return ciphertext

