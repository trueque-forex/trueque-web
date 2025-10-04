import sqlite3

conn = sqlite3.connect("trueque.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS daily_rates (
    date TEXT NOT NULL,
    base TEXT NOT NULL,
    target TEXT NOT NULL,
    rate REAL NOT NULL,
    source TEXT,
    PRIMARY KEY (date, base, target)
)
""")

conn.commit()
conn.close()
print("✅ daily_rates table created.")