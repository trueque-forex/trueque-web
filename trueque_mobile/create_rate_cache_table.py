import sqlite3

conn = sqlite3.connect("trueque.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS rate_cache (
    timestamp TEXT PRIMARY KEY,
    base TEXT NOT NULL,
    target TEXT NOT NULL,
    rate REAL NOT NULL,
    source TEXT
)
""")

conn.commit()
conn.close()
print("✅ rate_cache table created.")