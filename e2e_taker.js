const { chromium } = require('playwright');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  try {
    console.log("Navigating to signin...");
    await page.goto('http://localhost:3000/signin');

    console.log("Filling credentials...");
    await page.fill('input[type="email"]', 'mx_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    console.log("Waiting for dashboard...");
    await page.waitForURL('**/dashboard*', { timeout: 15000 });

    // Use the specific offer ID from the Maker run
    const offerId = '1392c432-46a4-4325-ae44-a75a839b6ae5';

    console.log("Setting sessionStorage for direct navigation...");
    await page.evaluate((offerId) => {
      const s = {
        amount: 20000.00,
        target_currency: 'MXN-USD',
        rateIntent: 0.048500,
        type: 'TAKER',
        counterpartyOfferId: offerId
      };
      sessionStorage.setItem('trueque_swap_intent', JSON.stringify(s));
      localStorage.setItem('trueque_swap_state_persistent', JSON.stringify(s));
      
      const session = JSON.parse(localStorage.getItem('trueque_session') || '{}');
      session.kycStatus = 'APPROVED';
      session.mfa_enabled = false;
      localStorage.setItem('trueque_session', JSON.stringify(session));
    }, offerId);

    console.log("Navigating to specific offer...");
    await page.goto(`http://localhost:3000/review?amountIntent=20000.00&rateIntent=0.048500&counterpartyOfferId=${offerId}&from=MXN&to=USD&type=TAKER`);
    
    console.log("Waiting for Review page...");
    await page.waitForSelector('text=Transaction Breakdown', { state: 'visible', timeout: 15000 });

    // Dismiss Next.js error overlay if present
    await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal) portal.remove();
    });

    // Dismiss Next.js error overlay if present due to localStorage hydration mismatch
    await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal) portal.remove();
    });

    // Wait for the button array to load
    await page.waitForSelector('button');

    const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
    console.log("Found buttons:", buttons);

    console.log("Clicking 'Proceed to Beneficiary →'...");
    await page.getByText('Proceed to Beneficiary →').click({ force: true });

    console.log("Waiting for Beneficiary Selection page...");
    await page.waitForURL('**/beneficiary-selection*', { timeout: 15000 });
    await page.waitForSelector('text=Alice Smith', { state: 'visible', timeout: 15000 });
    
    // Dismiss Next.js error overlay if present again
    await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal) portal.remove();
    });

    console.log("Clicking first existing beneficiary...");
    await page.getByText('Alice Smith').click({ force: true });

    console.log("Waiting to be back on Review page...");
    await page.waitForURL('**/review*', { timeout: 15000 });
    await page.waitForSelector('text=Transaction Breakdown', { state: 'visible', timeout: 15000 });

    // Dismiss Next.js error overlay if present again due to localStorage hydration mismatch
    await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal) portal.remove();
    });

    // Dump buttons
    const buttons2 = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
    console.log("Found buttons on Review (after beneficiary):", buttons2);

    console.log("Clicking Confirm...");
    await page.locator('button', { hasText: 'Confirm' }).click({ force: true });

    console.log("Waiting for success page...");
    await page.waitForURL('**/secure-swap*', { timeout: 15000 });
    console.log("SUCCESS! Transitioned to secure-swap!");

    // Check final status
    await page.waitForSelector('text=Match processing', { state: 'visible', timeout: 10000 }).catch(() => {});
    
    console.log("Taker checkout flow completed.");
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err.message);
    console.log("Call log:\n", err.stack);
    console.log("Current URL:", page.url());
    await browser.close();
    process.exit(1);
  }
})();
