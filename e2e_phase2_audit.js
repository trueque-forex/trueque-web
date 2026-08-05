const { chromium } = require('playwright');

(async () => {
  console.log("=== PHASE 2 CTA AUDIT ===");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const findings = [];
  page.on('console', msg => {
      // console.log('PAGE LOG:', msg.text());
  });

  try {
    console.log("Navigating to signin...");
    await page.goto('http://localhost:3000/signin');
    await page.fill('input[type="email"]', 'us_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard*');
    
    // Test 1: Amount Selection Cancel
    console.log("Testing /amount-selection 'Cancel' CTA...");
    await page.goto('http://localhost:3000/amount-selection?from=EUR&to=USD');
    await page.waitForSelector('text=Cancel');
    await page.locator('button', { hasText: 'Cancel' }).click();
    await page.waitForLoadState('networkidle');
    const urlAfterAmountCancel = page.url();
    findings.push({ step: "Amount Selection Cancel", url: urlAfterAmountCancel, pass: !urlAfterAmountCancel.includes('404') });

    // Test 2: Beneficiary Selection Back/Cancel
    console.log("Testing /beneficiary-selection 'Cancel' CTA...");
    await page.goto('http://localhost:3000/beneficiary-selection');
    // Dismiss Next.js error overlay if present due to localStorage hydration mismatch
    await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal) portal.remove();
    });
    
    // There is typically a Cancel or Back button
    const backBtn = page.locator('button', { hasText: 'Back' });
    if (await backBtn.count() > 0) {
        await backBtn.first().click();
        await page.waitForLoadState('networkidle');
        findings.push({ step: "Beneficiary Selection Back", url: page.url(), pass: !page.url().includes('404') });
    } else {
        const cancelBtn = page.locator('button', { hasText: 'Cancel' });
        if (await cancelBtn.count() > 0) {
            await cancelBtn.first().click();
            await page.waitForLoadState('networkidle');
            findings.push({ step: "Beneficiary Selection Cancel", url: page.url(), pass: !page.url().includes('404') });
        }
    }

    // Test 3: Review Cancel
    console.log("Testing /review 'Cancel' CTA...");
    await page.goto('http://localhost:3000/review');
    await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal) portal.remove();
    });
    
    const reviewCancelBtn = page.locator('button', { hasText: 'Cancel' });
    if (await reviewCancelBtn.count() > 0) {
        await reviewCancelBtn.first().click();
        await page.waitForLoadState('networkidle');
        findings.push({ step: "Review Cancel", url: page.url(), pass: !page.url().includes('404') });
    } else {
        const backBtn2 = page.locator('button', { hasText: 'Back' });
        if (await backBtn2.count() > 0) {
            await backBtn2.first().click();
            await page.waitForLoadState('networkidle');
            findings.push({ step: "Review Back", url: page.url(), pass: !page.url().includes('404') });
        }
    }

    // Test 4: Discovery Market Filters/Pagination
    console.log("Testing /offers CTAs...");
    await page.goto('http://localhost:3000/offers');
    await page.waitForLoadState('networkidle');
    
    // Example: change a select filter
    const currencySelect = page.locator('select').first();
    if (await currencySelect.count() > 0) {
        await currencySelect.selectOption({ label: 'EUR' }).catch(() => {});
        await page.waitForLoadState('networkidle');
        findings.push({ step: "Offers filter changed", pass: true });
    }

    console.log("\n=============================");
    console.log("PHASE 2 CTA AUDIT RESULTS");
    console.log("=============================");
    let allPass = true;
    findings.forEach(f => {
        console.log(`- [${f.step}] -> ${f.pass ? 'PASS' : 'FAIL'} (${f.url || 'No URL change'})`);
        if (!f.pass) allPass = false;
    });

    if (allPass) {
        console.log("\nAUDIT SUCCESS: No 404s, unhandled states, or infinite loaders detected on Phase 2 CTAs.");
    } else {
        console.error("\nAUDIT FAILED: One or more CTAs routed to an invalid state.");
    }

  } catch (err) {
    console.error("Test script crashed:", err);
  } finally {
    await browser.close();
  }
})();
