const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Navigating to signin...");
  await page.goto('http://localhost:3000/signin');
  await page.fill('input[type="email"]', 'mx_test@symmetri.dev');
  await page.fill('input[type="password"]', 'uS_test!234');
  await page.click('button:has-text("Sign In")');

  console.log("Waiting for dashboard...");
  await page.waitForURL('**/dashboard*', { timeout: 15000 });

  const offerId = '1392c432-46a4-4325-ae44-a75a839b6ae5';
  await page.goto(`http://localhost:3000/review?amountIntent=20000.00&rateIntent=0.048500&counterpartyOfferId=${offerId}&from=MXN&to=USD&type=TAKER`);
  await page.waitForSelector('text=Transaction Breakdown', { state: 'visible', timeout: 15000 });

  console.log("Fetching beneficiaries via evaluate...");
  const result = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/beneficiaries');
      const text = await res.text();
      return { status: res.status, text };
    } catch (e) {
      return { error: e.message };
    }
  });

  console.log("Result:", result);
  await browser.close();
})();
