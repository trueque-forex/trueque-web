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

  console.log("Navigating to signin...");
  await page.goto('http://localhost:3000/signin');
  
  console.log("Filling credentials...");
  await page.fill('input[type="email"]', 'us_test@symmetri.dev');
  await page.fill('input[type="password"]', 'uS_test!234');
  await page.click('button:has-text("Sign In")');

  console.log("Waiting for MFA page or error...");
  
  try {
    // Wait for the MFA code input (placeholder 000000) or an error
    await Promise.race([
      page.waitForSelector('input[placeholder="000000"]', { timeout: 10000 }),
      page.waitForSelector('text=Sign in failed', { timeout: 10000 }),
      page.waitForSelector('.bg-red-50', { timeout: 10000 })
    ]);
  } catch (e) {
    console.log("Timeout waiting for MFA. Page content:");
    console.log(await page.innerText('body'));
    await browser.close();
    process.exit(1);
  }

  const isError = await page.$('.bg-red-50');
  if (isError) {
    console.log("Error during login:", await page.innerText('.bg-red-50'));
    await browser.close();
    process.exit(1);
  }

  console.log("READY_FOR_MFA");
  
  rl.question('Please provide the 6-digit MFA code: ', async (code) => {
    console.log("Received code: " + code);
    await page.fill('input[placeholder="000000"]', code.trim());
    await page.click('button:has-text("Verify Identity")');

    console.log("Waiting for dashboard...");
    await page.waitForURL('**/dashboard*');
    console.log("Login successful! Saving state...");

    await context.storageState({ path: 'auth.json' });
    console.log("State saved to auth.json.");
    
    console.log("Entering interactive REPL mode. Send playwright commands to evaluate.");
    rl.on('line', async (line) => {
      if (line.trim() === 'exit') {
        await browser.close();
        process.exit(0);
      }
      try {
        const result = await eval(`(async () => { return ${line} })()`);
        console.log("RESULT:", result);
      } catch (err) {
        console.error("ERROR:", err.message);
      }
    });
  });
})();
