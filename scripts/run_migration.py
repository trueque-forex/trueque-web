import os
import sys
from sqlalchemy import create_engine, text

sys.path.append(os.getcwd())
from backend.database import DATABASE_URL

def run_migration():
    engine = create_engine(DATABASE_URL)
    with engine.begin() as conn:
        try:
            print("Renaming column trueque_id to tid in users table...")
            conn.execute(text("ALTER TABLE users RENAME COLUMN trueque_id TO tid"))
            print("Column renamed successfully.")
        except Exception as e:
            print(f"Error renaming column (it might already exist): {e}")

        try:
            print("Adding updated_at column to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
            print("Column added successfully.")
        except Exception as e:
            print(f"Error adding column (it might already exist): {e}")

if __name__ == '__main__':
    run_migration()
