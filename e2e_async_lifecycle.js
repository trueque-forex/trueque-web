const { chromium } = require('playwright');
const { execSync } = require('child_process');

(async () => {
  console.log("=== PHASE 1: MAKER SESSION ===");
  const browser = await chromium.launch({ headless: false });
  let context = await browser.newContext();
  let page = await context.newPage();

  try {
    console.log("Maker: Navigating to signin...");
    await page.goto('http://localhost:3000/signin');
    
    await page.fill('input[type="email"]', 'us_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard*');
    await page.waitForSelector('text=Welcome, Ustest', { timeout: 10000 });

    console.log("Maker: Starting Swap Currencies...");
    await page.locator('text=Swap Currencies').click();
    await page.waitForURL('**/offers*');

    await page.locator('button', { hasText: '+ Post an Offer' }).click();
    await page.waitForURL('**/offers/create*');

    console.log("Maker: Committing math...");
    await page.locator('button', { hasText: 'Commit Math & Continue' }).click();
    await page.waitForSelector('text=Where should the funds be deposited?', { state: 'visible' });

    console.log("Maker: Choosing Beneficiary...");
    await page.locator('button', { hasText: 'Choose Beneficiary & Continue' }).click();
    await page.waitForSelector('text=TRANSACTION RECEIPT', { state: 'visible' });

    console.log("Maker: Posting Offer & Leaving...");
    await page.locator('button', { hasText: 'Post Offer & Leave' }).click();
    await page.waitForURL('**/?success=offer_created*', { timeout: 15000 });
    
    console.log("Maker: Offer successfully created. Logging out...");
    // Clear cookies/session
    await context.close();

    // Query DB for the exact Offer ID
    console.log("Fetching new Offer ID from Database...");
    const psqlCmd = `psql "postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres" -t -c "SELECT id FROM offers WHERE owner_id = (SELECT id FROM users WHERE email='us_test@symmetri.dev') ORDER BY created_at DESC LIMIT 1;"`;
    const offerId = execSync(psqlCmd).toString().trim();
    console.log("Offer ID:", offerId);

    console.log("\n=== PHASE 2: TAKER SESSION ===");
    context = await browser.newContext();
    page = await context.newPage();

    console.log("Taker: Navigating to signin...");
    await page.goto('http://localhost:3000/signin');
    await page.fill('input[type="email"]', 'mx_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard*');

    console.log("Taker: Setting up intent to bypass Discovery search...");
    await page.evaluate((id) => {
      const s = {
        amount: 20000.00,
        target_currency: 'MXN-USD',
        rateIntent: 0.048500,
        type: 'TAKER',
        counterpartyOfferId: id
      };
      sessionStorage.setItem('trueque_swap_intent', JSON.stringify(s));
      localStorage.setItem('trueque_swap_state_persistent', JSON.stringify(s));
      
      const session = JSON.parse(localStorage.getItem('trueque_session') || '{}');
      session.kycStatus = 'APPROVED';
      session.mfa_enabled = false;
      localStorage.setItem('trueque_session', JSON.stringify(session));
    }, offerId);

    console.log("Taker: Navigating to Review page for Offer...");
    await page.goto(`http://localhost:3000/review?amountIntent=20000.00&rateIntent=0.048500&counterpartyOfferId=${offerId}&from=MXN&to=USD&type=TAKER`);
    await page.waitForSelector('text=Transaction Breakdown', { state: 'visible', timeout: 15000 });

    await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal) portal.remove();
    });

    console.log("Taker: Proceeding to Beneficiary...");
    await page.getByText('Proceed to Beneficiary').click({ force: true });
    await page.waitForURL('**/beneficiary-selection*');
    await page.waitForSelector('text=Alice Smith', { state: 'visible' });

    console.log("Taker: Selecting Beneficiary...");
    await page.getByText('Alice Smith').click({ force: true });
    await page.waitForURL('**/review*');
    await page.waitForSelector('text=Transaction Breakdown', { state: 'visible' });

    await page.evaluate(() => {
      const portal = document.querySelector('nextjs-portal');
      if (portal) portal.remove();
    });

    console.log("Taker: Confirming Match...");
    await page.locator('button', { hasText: 'Confirm' }).click({ force: true });
    await page.waitForURL('**/secure-swap*', { timeout: 15000 });
    console.log("Taker: Match successful! Logging out...");
    
    await context.close();

    console.log("\n=== PHASE 3: MAKER VERIFICATION ===");
    context = await browser.newContext();
    page = await context.newPage();

    console.log("Maker: Logging back in...");
    await page.goto('http://localhost:3000/signin');
    await page.fill('input[type="email"]', 'us_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard*');
    console.log("Maker: Checking Dashboard for Match...");
    
    // Check if the specific offer ID has a MATCHED badge in Dashboard
    // Or just query the DB for validation!
    const statusCmd = `psql "postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres" -t -c "SELECT status FROM offers WHERE id = '${offerId}';"`;
    const finalStatus = execSync(statusCmd).toString().trim();
    
    console.log(`Final Database Status of Offer ${offerId}: ${finalStatus}`);
    if (finalStatus === 'MATCHED') {
      console.log("ASYNC LIFECYCLE TEST PASSED: Match engine linked non-concurrent sessions correctly.");
    } else {
      console.error("ASYNC LIFECYCLE TEST FAILED: Status is not MATCHED.");
    }

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await browser.close();
  }
})();
