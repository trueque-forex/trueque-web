const { chromium } = require('playwright');

(async () => {
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

    console.log("Logging in as KYC PENDING user...");
    await page.fill('input[type="email"]', 'kyc_pending@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard*', { timeout: 15000 });
    console.log("Logged in successfully! On Dashboard.");
    
    // 1. Dashboard: "Send Value (Quick Send)"
    console.log("Checking 'Quick Send' CTA on Dashboard...");
    const quickSendButton = page.locator('text=Quick Send ⚡');
    await quickSendButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const urlAfterQuickSend = page.url();
    findings.push({ 
        cta: 'Quick Send', 
        result: urlAfterQuickSend.includes('/kyc') ? 'Redirected to /kyc' : `Allowed into checkout flow! (${urlAfterQuickSend})` 
    });
    
    // Return to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Dashboard: "Swap Currencies"
    console.log("Checking 'Swap Currencies' CTA on Dashboard...");
    const swapButton = page.locator('text=Swap Currencies');
    await swapButton.click();
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const urlAfterSwap = page.url();
    
    // Check if it allowed it despite the visual grey-out
    findings.push({ 
        cta: 'Swap Currencies', 
        result: urlAfterSwap.includes('/kyc') ? 'Redirected to /kyc' : (urlAfterSwap.includes('/offers') ? 'Allowed into Discovery flow!' : `Action result: ${urlAfterSwap}`) 
    });

    // 3. Discovery Market (Taker Flow): "Accept Offer"
    console.log("Navigating to Discovery Market (/offers)...");
    await page.goto('http://localhost:3000/offers');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log("Clicking 'Accept Offer' on an OPEN swap...");
    const acceptOfferButton = page.locator('button:has-text("Accept Offer")').first();
    if (await acceptOfferButton.count() > 0) {
        await acceptOfferButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        const urlAfterAccept = page.url();
        findings.push({ 
            cta: 'Accept Offer (Discovery)', 
            result: urlAfterAccept.includes('/kyc') ? 'Redirected to /kyc' : `Allowed into Taker checkout! (${urlAfterAccept})` 
        });
    } else {
        findings.push({ 
            cta: 'Accept Offer (Discovery)', 
            result: 'No OPEN offers found to click.' 
        });
    }

    console.log("\n=============================");
    console.log("KYC STATE AUDIT RESULTS");
    console.log("=============================");
    findings.forEach(f => {
        console.log(`- [${f.cta}] -> ${f.result}`);
    });

  } catch (err) {
    console.error("Audit script failed:", err);
  } finally {
    await browser.close();
  }
})();
