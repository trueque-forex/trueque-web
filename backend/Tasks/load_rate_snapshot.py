import requests
import sqlite3
from datetime import datetime

def fetch_and_store_rate(base: str, target: str):
    url = f"https://api.exchangerate.host/latest?base={base}&symbols={target}"
    try:
        response = requests.get(url, timeout=10)
        data = response.json()

        # Debug print to inspect response
        print("🔍 Raw response:", data)

        # Validate response structure
        if "rates" not in data or target not in data["rates"]:
            print(f"❌ Failed to fetch rate for {base}→{target}. Response: {data}")
            return

        rate = data["rates"][target]
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")

        conn = sqlite3.connect("trueque.db")
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO rate_cache (timestamp, base, target, rate, source)
            VALUES (?, ?, ?, ?, ?)
        """, (timestamp, base, target, rate, "ExchangeRate.host"))
        conn.commit()
        conn.close()

        print(f"✅ Cached {base}→{target} rate at {timestamp}: {rate}")

    except Exception as e:
        print(f"❌ Exception occurred: {e}")

# Run the loader
fetch_and_store_rate("COP", "USD")