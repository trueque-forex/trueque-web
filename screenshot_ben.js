const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log("Navigating to signin...");
  await page.goto('http://localhost:3000/signin');

  console.log("Filling credentials...");
  await page.fill('input[type="email"]', 'mx_test@symmetri.dev');
  await page.fill('input[type="password"]', 'uS_test!234');
  await page.getByRole('button', { name: /Sign In/i }).click();

  console.log("Waiting for dashboard...");
  await page.waitForURL('**/dashboard*', { timeout: 15000 });

  const offerId = '1392c432-46a4-4325-ae44-a75a839b6ae5';

  console.log("Setting sessionStorage...");
  await page.evaluate((offerId) => {
    const s = {
      amount: 20000.00,
      target_currency: 'MXN-USD',
      exchange_rate: 0.048500,
      type: 'TAKER',
      counterpartyOfferId: offerId
    };
    sessionStorage.setItem('trueque_swap_intent', JSON.stringify(s));
    localStorage.setItem('trueque_swap_state_persistent', JSON.stringify(s));
  }, offerId);

  console.log("Navigating to specific offer...");
  await page.goto(`http://localhost:3000/review?amountIntent=20000.00&rateIntent=0.048500&counterpartyOfferId=${offerId}&from=MXN&to=USD&type=TAKER`);

  console.log("Waiting for Review page...");
  await page.waitForSelector('button:has-text("Proceed to Beneficiary")', { state: 'visible', timeout: 15000 });

  console.log("Clicking 'Proceed to Beneficiary'...");
  await page.getByText('Proceed to Beneficiary').click();

  console.log("Waiting for Beneficiary Selection page...");
  await page.waitForURL('**/beneficiary-selection*', { timeout: 15000 });
  
  // Wait a bit to let it load
  await page.waitForTimeout(3000);
  
  console.log("Current URL:", page.url());
  console.log("Dumping HTML...");
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('page.html', html);
  console.log("HTML saved to page.html");

  await browser.close();
  console.log("Done");
})();
