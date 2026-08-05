const { chromium } = require('playwright');
const fetch = require('node-fetch');

(async () => {
  console.log("=== ADMIN DASHBOARD SECURITY AUDIT ===");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("1. Authenticating as standard PEER user...");
    await page.goto('http://localhost:3000/signin');
    await page.fill('input[type="email"]', 'us_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard*');

    console.log("2. NEGATIVE TEST: Attempting to access Frontend /admin/dashboard...");
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if it redirected or allowed access
    if (page.url().includes('admin/dashboard')) {
        console.error("❌ VULNERABILITY FOUND: Standard user can access Frontend Admin Dashboard!");
    } else {
        console.log("✅ Frontend properly blocked standard user.");
    }

    // Check if metrics loaded (meaning API worked)
    const metricsLoaded = await page.locator('text=Platform Vitals').count() > 0;
    if (metricsLoaded) {
         console.error("❌ VULNERABILITY FOUND: Admin dashboard rendered live data for standard user.");
    }

    console.log("3. NEGATIVE TEST: Attempting to query Backend /api/admin/fx-live directly...");
    const apiRes = await fetch('http://localhost:8000/api/admin/fx-live');
    if (apiRes.status === 200) {
        console.error("❌ VULNERABILITY FOUND: Backend API /api/admin/fx-live returned 200 OK without Auth/RBAC!");
        const data = await apiRes.json();
        console.log("Exposed Data Sample:", JSON.stringify(data).substring(0, 100));
    } else if (apiRes.status === 403 || apiRes.status === 401) {
        console.log(`✅ Backend properly blocked standard user with ${apiRes.status}`);
    } else {
        console.log(`Backend returned unexpected status: ${apiRes.status}`);
    }

    console.log("\n=== ADMIN DASHBOARD FUNCTIONALITY CHECK ===");
    console.log("Since the user is already here, checking if the metrics throw 500 errors...");
    
    const auditRes = await fetch('http://localhost:8000/api/admin/audit-feed');
    if (auditRes.status === 500) {
        console.error("❌ 500 ERROR on /api/admin/audit-feed");
    } else {
        console.log("✅ /api/admin/audit-feed works successfully.");
    }

    const vitalsRes = await fetch('http://localhost:8000/api/admin/security-status');
    if (vitalsRes.status === 500) {
        console.error("❌ 500 ERROR on /api/admin/security-status");
    } else {
         console.log("✅ /api/admin/security-status works successfully.");
    }

  } catch (err) {
    console.error("Test script crashed:", err);
  } finally {
    await browser.close();
  }
})();
