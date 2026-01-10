
import requests
import json
import random
import time

BASE_URL = "http://localhost:3000"

def verify_signup():
    email = f"carlos.test.{random.randint(1000,9999)}@trueque.dev"
    password = "Password123!"
    
    payload = {
        "email": email,
        "password": password,
        "confirmPassword": password,
        "first_name": "Carlos",
        "last_name": "Test",
        "dob": "1990-01-01",
        "phone": "+52 5512345678",
        "country_of_residence": "MX",
        "country_destiny": "US",
        "address": "Av. Reforma 123",
        "is_test": True
    }
    
    print(f"🚀 Testing Signup for: {email}")
    
    try:
        # 1. Signup
        res = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        print(f"Signup Status: {res.status_code}")
        
        if res.status_code != 200:
            print(f"❌ Signup Failed: {res.text}")
            return

        cookies = res.cookies
        print(f"🍪 Cookies Received: {cookies.get_dict()}")
        
        if 'trueque_sid' not in cookies.get_dict():
            print("❌ 'trueque_sid' cookie NOT found in response!")
            return
        
        print("✅ Session Cookie Found!")
        
        # 2. Profile Check (Simulate immediate redirect)
        print("🔍 Checking Profile with Cookie...")
        res_prof = requests.get(f"{BASE_URL}/api/profile", cookies=cookies)
        print(f"Profile Status: {res_prof.status_code}")
        
        if res_prof.status_code == 200:
            print("✅ Profile Access Successful!")
            print(f"User: {res_prof.json().get('email')}")
        else:
            print(f"❌ Profile Access Failed: {res_prof.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify_signup()
