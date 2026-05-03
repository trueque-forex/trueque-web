const http = require('http');

// Configuration
const CONFIG = {
    hostname: 'localhost',
    port: 3000,
    timeout: 5000
};

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m"
};

function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    let color = colors.reset;
    switch (type) {
        case 'success': color = colors.green; break;
        case 'error': color = colors.red; break;
        case 'warn': color = colors.yellow; break;
        case 'info': color = colors.cyan; break;
    }
    console.log(`${colors.blue}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

function makeRequest(path, method, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CONFIG.hostname,
            port: CONFIG.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ statusCode: res.statusCode, body: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runMobileTests() {
    log('📱 Starting Trueque Mobile API Connection Test...', 'info');

    const uniqueEmail = `mobile_test_${Date.now()}@example.com`;
    const password = 'password123';

    // 1. Test Mobile Signup
    log('\n1️⃣  Testing Mobile Signup (/api/mobile/signup)...', 'info');
    let signupSuccess = false;
    try {
        const signupRes = await makeRequest('/api/mobile/signup', 'POST', {
            email: uniqueEmail,
            password: password,
            firstName: 'Mobile',
            lastName: 'Tester',
            phone: '+1234567890'
        });

        if (signupRes.statusCode === 201) {
            if (signupRes.body.token) {
                log(`✅ Signup Successful! Token received.`, 'success');
                log(`   User: ${signupRes.body.user?.email}`, 'info');
                signupSuccess = true;
            } else {
                log(`⚠️ Signup Status ${signupRes.statusCode} but no token?`, 'warn');
                console.log(signupRes.body);
            }
        } else {
            log(`❌ Signup Failed: ${signupRes.statusCode}`, 'error');
            console.log(signupRes.body);
        }
    } catch (e) {
        log(`❌ Signup Error: ${e.message}`, 'error');
    }

    // 2. Test Mobile Signin (only if signup worked)
    if (signupSuccess) {
        log('\n2️⃣  Testing Mobile Signin (/api/mobile/signin)...', 'info');
        try {
            const signinRes = await makeRequest('/api/mobile/signin', 'POST', {
                email: uniqueEmail,
                password: password
            });

            if (signinRes.statusCode === 200 && signinRes.body.token) {
                log(`✅ Signin Successful! Token received.`, 'success');
                log(`   User: ${signinRes.body.user?.email}`, 'info');
            } else {
                log(`❌ Signin Failed: ${signinRes.statusCode}`, 'error');
                console.log(signinRes.body);
            }
        } catch (e) {
            log(`❌ Signin Error: ${e.message}`, 'error');
        }
    } else {
        log('\n⏭️  Skipping Signin test due to Signup failure.', 'warn');
    }

    // 3. Test Protected Route (Profile) using Token
    if (signupSuccess) { // Assuming if signup worked, we have a valid flow. Ideally check signinto too but var scope is tricky here without refactor.
        // Actually, we need the token from signin.
        // Let's refactor slightly or just re-login.
        // Simpler: assume the previous steps worked effectively.

        // Refetch token specifically for this step to be robust
        log('\n3️⃣  Testing Protected Route (/api/user/profile)...', 'info');
        try {
            // value of uniqueEmail and password are known
            const authRes = await makeRequest('/api/mobile/signin', 'POST', {
                email: uniqueEmail,
                password: password
            });

            if (authRes.body.token) {
                const token = authRes.body.token;
                const profileRes = await makeRequest('/api/user/profile', 'GET', null, token);

                if (profileRes.statusCode === 200) {
                    log(`✅ Profile Fetch Successful!`, 'success');
                    log(`   Data: ${JSON.stringify(profileRes.body)}`, 'info');
                } else {
                    log(`❌ Profile Fetch Failed: ${profileRes.statusCode}`, 'error');
                    console.log(profileRes.body);
                }
            } else {
                log(`⚠️ Could not get token for Step 3`, 'warn');
            }

        } catch (e) {
            log(`❌ Profile Test Error: ${e.message}`, 'error');
        }
    }

    log('\n🏁 Mobile API Test Complete', 'info');
}

// Wait for server to be ready
async function waitForServer() {
    let retries = 5;
    while (retries > 0) {
        try {
            await makeRequest('/api/health', 'GET'); // Assuming there's a health check or just root
            return true;
        } catch (e) {
            log('⏳ Waiting for server...', 'warn');
            await new Promise(r => setTimeout(r, 1000));
            retries--;
        }
    }
    // If health check fails, just try running tests anyway, maybe root 404s but api works
    return true;
}

(async () => {
    await waitForServer();
    await runMobileTests();
})();
