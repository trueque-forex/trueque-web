const { chromium } = require('playwright');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: false });
  let page;
  try {
    const context = await browser.newContext();
    page = await context.newPage();

    console.log("Navigating to signin...");
    await page.goto('http://localhost:3000/signin');
    
    console.log("Filling credentials...");
    await page.fill('input[type="email"]', 'us_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    console.log("Waiting for dashboard and user context to load...");
    await page.waitForURL('**/dashboard*');
    // Wait for the auth context to finish loading the user
    await page.waitForSelector('text=Welcome, Ustest', { timeout: 10000 });

    console.log("Clicking 'Swap Currencies'...");
    // The onClick handler is on a div, clicking the text inside works.
    await page.locator('text=Swap Currencies').click();
    
    console.log("Waiting for /offers...");
    await page.waitForURL('**/offers*', { timeout: 10000 });

    console.log("Clicking '+ Post an Offer'...");
    await page.locator('button', { hasText: '+ Post an Offer' }).click();
    
    console.log("Waiting for /offers/create...");
    await page.waitForURL('**/offers/create*', { timeout: 10000 });

    console.log("On Step 1, committing math...");
    await page.locator('button', { hasText: 'Commit Math & Continue' }).click();

    console.log("Waiting for Step 2...");
    // Wait for the Step 1 loading to finish and Step 2 button to become enabled/visible
    await page.waitForSelector('text=Where should the funds be deposited?', { state: 'visible' });

    console.log("On Step 2, selecting beneficiary...");
    await page.locator('button', { hasText: 'Choose Beneficiary & Continue' }).click();

    console.log("Waiting for Step 3...");
    await page.waitForSelector('text=TRANSACTION RECEIPT', { state: 'visible' });

    console.log("On Step 3, finalizing offer...");
    await page.locator('button', { hasText: 'Post Offer & Leave' }).click();

    console.log("Waiting for success redirect...");
    await page.waitForURL('**/?success=offer_created*', { timeout: 15000 });
    
    console.log("Wizard completed successfully! OPEN offer created.");
  } catch (error) {
    console.error("Test failed:", error);
    if (page) {
       console.log("Current URL:", page.url());
       console.log("Page Content:", await page.innerText('body'));
    }
  } finally {
    await browser.close();
  }
})();
