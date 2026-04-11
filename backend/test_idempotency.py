import unittest
from fastapi.testclient import TestClient
from backend.main import app 
from backend.routes.offers import IDEMPOTENCY_CACHE

client = TestClient(app)

class TestIdempotency(unittest.TestCase):
    def setUp(self):
        # Clear cache before each test
        IDEMPOTENCY_CACHE.clear()
        
    def test_idempotency_behavior(self):
        key = "test-key-123"
        payload = {
            "user_id": "user_1",
            "uuid": "req_1", # This is ignored/regen by backend logic usually or used as offer ID? 
            # Wait, schema requires uuid. But route generates tx_uuid. 
            # Schema says: uuid: str = Field(..., description="Unique identifier for the offer")
            # Route says: tx_uuid = f"TX-{uuid.uuid4()}" and puts it in db.
            # But the route receives `OfferCreate` which has `uuid`.
            # Let's check `offer_schema.py`. It has uuid.
            # The backend ignores the incoming uuid for the DB `uuid` col? 
            # new_offer = Offer(..., uuid=tx_uuid, ...)
            # So input uuid is likely the client-side ref or ignored. 
            "uuid": "client-ref-1",
            "country": "ES",
            "currency_from": "EUR",
            "currency_to": "USD",
            "amount": "100.00",
            "amount_from": "100.00",
            "amount_to": "110.00"
        }
        
        # 1. First Request
        headers = {"Idempotency-Key": key}
        response1 = client.post("/api/offers/create", json=payload, headers=headers)
        
        # Expect 200/201 (Route returns 200 by default currently or dict)
        if response1.status_code not in [200, 201]:
             print(f"Req 1 Faied: {response1.text}")
        self.assertEqual(response1.status_code, 200)
        data1 = response1.json()
        tx_id_1 = data1["id"]
        
        # 2. Duplicate Request (Same Key)
        response2 = client.post("/api/offers/create", json=payload, headers=headers)
        self.assertEqual(response2.status_code, 200)
        data2 = response2.json()
        tx_id_2 = data2["id"]
        
        # 3. Assert IDs match (Cached)
        self.assertEqual(tx_id_1, tx_id_2)
        
        # 4. New Request (Diff Key)
        headers3 = {"Idempotency-Key": "test-key-456"}
        response3 = client.post("/api/offers/create", json=payload, headers=headers3)
        self.assertEqual(response3.status_code, 200)
        tx_id_3 = response3.json()["id"]
        self.assertNotEqual(tx_id_1, tx_id_3)

if __name__ == '__main__':
    unittest.main()
