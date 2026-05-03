import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./trueque.db" # This creates trueque.db
)

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# --- THE FIX: Register Models ---
# We import them here so Base.metadata.create_all() knows they exist
def create_tables():
    from backend.models.user import User
    from backend.models.transaction import Transaction
    from backend.models.match_model import Match
    Base.metadata.create_all(bind=engine)

# Request Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()