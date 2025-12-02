import os
import logging
from sqlalchemy import create_engine
from backend.models.models import metadata

# Use environment variable or fallback to local dev DB (SQLite)
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./trueque.db"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trueque_init_db")

def init_db():
    logger.info(f"🔧 Initializing database at {DATABASE_URL}...")
    
    connect_args = {}
    if "sqlite" in DATABASE_URL:
        connect_args = {"check_same_thread": False}
        
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
    
    logger.info("Creating tables...")
    metadata.create_all(engine)
    logger.info("✅ Tables created successfully.")

if __name__ == "__main__":
    init_db()
