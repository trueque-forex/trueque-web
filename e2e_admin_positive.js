const { chromium } = require('playwright');
const fetch = require('node-fetch');

(async () => {
  console.log("=== ADMIN DASHBOARD POSITIVE AUDIT ===");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("1. Authenticating as ADMIN user...");
    await page.goto('http://localhost:3000/signin');
    await page.fill('input[type="email"]', 'admin@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard*');

    console.log("2. Navigating to Frontend /admin/dashboard...");
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check if it allowed access
    if (page.url().includes('admin/dashboard')) {
        console.log("✅ Frontend properly allowed ADMIN user.");
    } else {
        console.error(`❌ VULNERABILITY FOUND: Admin user was blocked! URL: ${page.url()}`);
    }

    // Check if metrics loaded (meaning API worked)
    console.log("3. Verifying metrics rendered via Proxy API...");
    // Give it a second to fetch the metrics over the proxy
    await page.waitForTimeout(2000); 
    const metricsLoaded = await page.locator('text=Security Vitals').count() > 0;
    if (metricsLoaded) {
         console.log("✅ Admin dashboard rendered live data correctly for ADMIN user.");
    } else {
         console.error("❌ Admin dashboard failed to render live data.");
    }

  } catch (err) {
    console.error("Test script crashed:", err);
  } finally {
    await browser.close();
  }
})();
