import uuid, json, logging
from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres')
with engine.begin() as conn:
    conn.execute(text("""
        INSERT INTO retailers (id, name) 
        VALUES ('abarrey', 'Abarrey')
        ON CONFLICT (id) DO NOTHING;
    """))
    print('Inserted Abarrey into retailers')
