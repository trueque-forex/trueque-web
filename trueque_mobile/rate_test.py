import requests

def get_market_rate(base: str, target: str) -> tuple[float, str]:
    url = f"https://api.frankfurter.app/latest?from={base}&to={target}"
    response = requests.get(url)
    print("🔍 Status Code:", response.status_code)
    print("📦 Raw JSON:", response.text)

    try:
        data = response.json()
        rate = data["rates"][target]
        timestamp = data.get("date", "unknown")
        return rate, f"Frankfurter.app snapshot at {timestamp}"
    except Exception as e:
        print("⚠️ Error parsing rate:", e)
        return 0.0, "Frankfurter.app unavailable"

rate, rate_source = get_market_rate("COP", "USD")
print("Rate:", rate)
print("Source:", rate_source)