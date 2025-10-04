from sqlalchemy import create_engine
from backend.models.models import metadata

DATABASE_URL = "postgresql://postgres:trueque-mobile@localhost:5432/trueque_db"

engine = create_engine(DATABASE_URL)

if __name__ == "__main__":
    print("🔧 Creating tables in PostgreSQL...")
    metadata.create_all(engine)
    print("✅ Tables created successfully.")