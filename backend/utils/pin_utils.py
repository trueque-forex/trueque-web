from passlib.context import CryptContext

<<<<<<< HEAD
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
=======
# keep bcrypt available; use bcrypt for <=72-byte inputs
pwd_context = CryptContext(schemes=["bcrypt", "pbkdf2_sha256"], deprecated="auto")
BCRYPT_MAX = 72

def safe_hash(pin: str) -> str:
    pb = pin.encode("utf-8")
    if len(pb) > BCRYPT_MAX:
        raise ValueError("PIN too long for bcrypt")
    # explicitly use bcrypt for inputs within limit so tests see $2b$ prefix
    return pwd_context.hash(pb, scheme="bcrypt")
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
