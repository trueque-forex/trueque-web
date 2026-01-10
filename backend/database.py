import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sqlalchemy.ext.declarative import declarative_base

# Use environment variable or fallback to local dev DB (SQLite)
# Note: Ensure DATABASE_URL is set in your .env file for production
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./trueque.db"
)

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Request Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
