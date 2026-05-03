
import os
import zlib
from datetime import datetime
from sqlalchemy import create_engine, text

# -- TID GENERATION LOGIC --
def generate_base36_checksum(data: str) -> str:
    """ Computes 2-char base36 checksum from CRC32 """
    crc = zlib.crc32(data.encode('utf-8')) & 0xffffffff
    val = crc % 1296 # 36^2
    
    # Base36 encode (2 chars)
    chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    c2 = chars[val % 36]
    c1 = chars[val // 36]
    return c1 + c2

def generate_standard_tid(country: str, sequence: int = 1) -> str:
    date_str = datetime.utcnow().strftime("%Y%m%d")
    seq_str = f"{sequence:06d}"
    
    # Checksum payload
    payload = f"{date_str}|{country}|{seq_str}"
    chk = generate_base36_checksum(payload)
    
    return f"T{date_str}{country}{seq_str}{chk}"

# -- UPDATE DB --

# Load Env
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, val = line.split('=', 1)
                os.environ[key] = val

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found!")
    exit(1)

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        print("Generating Compliant TID for Antonio (ES)...")
        
        # Generate TID
        # Using Sequence 1 as he is our first/test user for this date
        new_tid = generate_standard_tid("ES", 1)
        
        print(f"Generated TID: {new_tid}")
        
        # Update
        conn.execute(
            text("UPDATE users SET tid = :tid WHERE email = 'antonio.nuevo@example.com'"),
            {"tid": new_tid}
        )
        conn.commit()
        
        # Verify
        result = conn.execute(
            text("SELECT email, tid FROM users WHERE email = 'antonio.nuevo@example.com'")
        ).fetchone()
        
        if result:
            print(f"✅ FINAL UPDATE: {result.email} -> {result.tid}")

except Exception as e:
    print(f"Error: {e}")
