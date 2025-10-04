def test_settlement_success(client, test_offer, test_user):
    response = client.post("/settle", json={
        "tx_id": test_offer.uuid,
        "user_id": str(test_user.id),
        "from_currency": test_offer.currency_from,
        "to_currency": test_offer.currency_to,
        "amount": test_offer.amount,
        "rate": 17.45,
        "timestamp": "2025-09-29T10:00:00",
        "status": "settled",
        "confirmed_by_user_id": test_user.id
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "settled"
    assert data["confirmed_by_user_id"] == test_user.id