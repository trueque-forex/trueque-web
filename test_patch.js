const fetch = require('node-fetch');

async function testPatch() {
  const offerId = 'a012d501-515b-4cc1-9d4c-2bd4159b980b'; // one of the DRAFT offers
  try {
    const res = await fetch(`http://localhost:3000/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        // Mocking the Next.js session is hard without a cookie.
        // Actually, this will fail with 401 Unauthorized because I don't have the auth cookie!
      },
      body: JSON.stringify({ 
        adyen_stored_payment_id: "mock_adyen_token_wizard_999",
        status: "OPEN" 
      })
    });
    const data = await res.text();
    console.log("Status:", res.status, "Data:", data);
  } catch (e) {
    console.error(e);
  }
}
testPatch();
