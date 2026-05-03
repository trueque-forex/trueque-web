
const fetch = require('node-fetch');

async function createSofia() {
    const url = 'http://localhost:3000/api/auth/signup';
    const payload = {
        email: 'sofia.tester@example.com',
        password: 'Symmetri123!',
        firstName: 'Sofia',
        lastName: 'Tester',
        dob: '1995-05-15',
        countryOfResidence: 'ES',
        phone: '+34600555444',
        is_test: true
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data = await res.json();
            console.log('✅ Sofia Created Successfully via API');
            console.log('User ID:', data.id);
            console.log('TID:', data.tid);
        } else {
            console.log(`❌ Failed: ${res.status}`);
            const txt = await res.text();
            console.log(txt);
        }
    } catch (e) {
        console.error('API Call Error:', e);
    }
}

createSofia();
