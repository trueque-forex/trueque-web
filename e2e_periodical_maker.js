const { chromium } = require('playwright');
const axios = require('axios');
const { Client } = require('pg');

async function checkDatabase(pool) {
  const res = await pool.query(`
    SELECT id, is_recurring, cadence, next_execution_date, status 
    FROM offers 
    WHERE owner_id = '9613090e-556d-4d15-8304-7ec99c8e8055' 
    ORDER BY created_at DESC 
    LIMIT 2
  `);
  return res.rows;
}

(async () => {
  console.log("=== PERIODICAL SWAPS (MAKER) E2E AUDIT ===");

  const pool = new Client({
    connectionString: "postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
  });
  await pool.connect();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    console.log("1. Authenticating as Maker...");
    await page.goto('http://localhost:3000/signin');
    await page.fill('input[type="email"]', 'mx_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/dashboard*');

    console.log("2. Navigating to Maker Wizard...");
    await page.goto('http://localhost:3000/offers/create');

    console.log("3. Creating Recurring Offer (MONTHLY)...");
    await page.fill('input[placeholder="0.00"]', '1000');
    // Fill the second input (Amount they will receive)
    await page.locator('input[placeholder="0.00"]').nth(1).fill('20000');
    
    // Toggle Recurring Swap
    await page.click('button[role="switch"], button.relative.inline-flex');
    
    // Select Cadence
    await page.selectOption('select:has(option[value="MONTHLY"])', { label: 'Monthly' });

    // Commit Math
    await page.click('button:has-text("Commit Math & Continue")');

    // Wait for Step 2
    console.log("4. Selecting Beneficiary...");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step2.png' });
    
    await page.waitForSelector('text=Mexican Bank');
    await page.click('text=Mexican Bank');
    const dom = await page.content();
    require('fs').writeFileSync('dom.html', dom);
    await page.waitForSelector('button:has-text("Choose Beneficiary")');
    await page.click('button:has-text("Choose Beneficiary")');

    // Wait for Step 3
    console.log("5. Finalizing Offer...");
    await page.waitForSelector('button:has-text("Post Offer")');
    await page.click('button:has-text("Post Offer")');

    // Wait for redirect to success
    await page.waitForURL('**/?success=offer_created*');
    console.log("✅ Frontend Successfully published recurring offer.");

    // 6. DB Validation for Template
    let offers = await checkDatabase(pool);
    let template = offers[0];
    if (template.is_recurring && template.cadence === 'MONTHLY' && template.next_execution_date) {
      console.log("✅ DB verified Template created correctly with next_execution_date:", template.next_execution_date);
    } else {
      throw new Error("Template not created correctly: " + JSON.stringify(template));
    }

    // 7. Trigger Cron
    console.log("7. Triggering Backend Cron Engine manually...");
    // Let's force the template's next_execution_date to NOW() so it picks it up
    await pool.query(`UPDATE offers SET next_execution_date = NOW() WHERE id = $1`, [template.id]);

    const cronRes = await axios.post('http://localhost:3000/api/cron/periodical-swaps', {}, {
      headers: {
        'Authorization': 'Bearer test_cron_secret'
      }
    });

    if (cronRes.data.success && cronRes.data.generated.length > 0) {
      console.log("✅ Cron successfully generated child offers:", cronRes.data.generated);
    } else {
      throw new Error("Cron failed to generate child offers: " + JSON.stringify(cronRes.data));
    }

    // 8. DB Validation for Child Offer
    offers = await checkDatabase(pool);
    const child = offers.find(o => o.id === cronRes.data.generated[0]);
    if (child && !child.is_recurring && child.status === 'OPEN') {
      console.log("✅ DB verified Child offer is not recurring and is OPEN.");
    } else {
      throw new Error("Child offer state invalid: " + JSON.stringify(child));
    }

    const updatedTemplate = offers.find(o => o.id === template.id);
    if (updatedTemplate.next_execution_date > template.next_execution_date) {
      console.log("✅ DB verified Template next_execution_date was bumped successfully.");
    } else {
      throw new Error("Template next_execution_date was not bumped.");
    }

    console.log("🎉 ALL PERIODICAL SWAPS TESTS PASSED!");
  } catch (err) {
    console.error("❌ E2E TEST FAILED:", err);
  } finally {
    await browser.close();
    await pool.end();
  }
})();
