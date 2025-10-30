<<<<<<< HEAD
from sqlalchemy import create_engine
from backend.models.models import metadata

DATABASE_URL = "postgresql://postgres:trueque-mobile@localhost:5432/trueque_db"

engine = create_engine(DATABASE_URL)

if __name__ == "__main__":
    print("🔧 Creating tables in PostgreSQL...")
    metadata.create_all(engine)
    print("✅ Tables created successfully.")
=======
import os, logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/trueque_dev")
logging.basicConfig(level=logging.INFO)
logging.getLogger("trueque_debug").info("DEBUG: effective DATABASE_URL=%s", DATABASE_URL)

engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)  # set echo=True later for SQL logging
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# when debugging
engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=True)
# and to also log parameterized queries
import logging
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
