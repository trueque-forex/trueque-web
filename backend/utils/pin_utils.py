from passlib.context import CryptContext

# Configure bcrypt hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MAX_BCRYPT_BYTES = 72

def safe_hash(pin: str) -> str:
    """Hash a PIN securely, enforcing bcrypt's 72-byte limit."""
    if len(pin.encode("utf-8")) > MAX_BCRYPT_BYTES:
        raise ValueError("PIN too long for bcrypt (max 72 bytes)")
    return pwd_context.hash(pin)

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verify a plain PIN against its hashed version."""
    try:
        return pwd_context.verify(plain_pin[:MAX_BCRYPT_BYTES], hashed_pin)
    except ValueError:
        return False