const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const brokenLinks = [];
  const visited = new Set();
  const targetPages = ['/dashboard', '/offers', '/profile'];

  try {
    console.log("Navigating to signin...");
    await page.goto('http://localhost:3000/signin');

    console.log("Filling credentials...");
    await page.fill('input[type="email"]', 'us_test@symmetri.dev');
    await page.fill('input[type="password"]', 'uS_test!234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard*', { timeout: 15000 });
    console.log("Logged in successfully!");

    // Helper to get all links on a page
    const getLinks = async (url) => {
      console.log(`\nScanning ${url} ...`);
      await page.goto(`http://localhost:3000${url}`);
      await page.waitForLoadState('networkidle');
      
      const hrefs = await page.$$eval('a', anchors => anchors.map(a => a.href).filter(h => h && h.startsWith('http://localhost:3000')));
      
      // Also look for buttons that might act as links (like router.push)
      // Since onClick isn't easily readable, we'll focus on actual <a> tags, 
      // but let's also find buttons and click them to see where they go if they aren't 'Log Out', 'Confirm', 'Sign In', 'Cancel'
      
      return hrefs;
    };

    let allLinksToTest = new Set();
    
    for (const p of targetPages) {
      const links = await getLinks(p);
      links.forEach(l => {
        const path = new URL(l).pathname;
        if (!visited.has(path) && !path.includes('/logout') && !path.includes('/signin')) {
          allLinksToTest.add(path);
        }
      });
    }

    console.log(`\nFound ${allLinksToTest.size} unique internal links to audit.`);
    
    // Add known programmatic routes that are CTAs
    const additionalCTAs = ['/kyc', '/voucher', '/history', '/vouchers'];
    additionalCTAs.forEach(cta => allLinksToTest.add(cta));

    console.log("Auditing links...");

    for (const link of allLinksToTest) {
      if (link === '/' || link === '/signin' || link === '/signup') continue;
      
      console.log(`Testing ${link} ...`);
      const response = await page.goto(`http://localhost:3000${link}`);
      
      if (response && response.status() >= 400) {
        brokenLinks.push({ link, status: response.status() });
        console.log(`  -> BROKEN! (${response.status()})`);
        continue;
      }

      // Check for 404 page content (Next.js custom 404)
      const is404 = await page.locator('text="404"').count() > 0 || await page.locator('text="Not Found"').count() > 0;
      if (is404) {
        brokenLinks.push({ link, status: '404 (Content)' });
        console.log(`  -> BROKEN! (404 Content)`);
        continue;
      }
      
      // Check for infinite loading states
      const isLoading = await page.locator('text="Loading..."').isVisible();
      if (isLoading) {
        // wait a bit to see if it resolves
        await page.waitForTimeout(3000);
        const stillLoading = await page.locator('text="Loading..."').isVisible();
        if (stillLoading) {
            brokenLinks.push({ link, status: 'Infinite Loading' });
            console.log(`  -> BROKEN! (Infinite Loading)`);
            continue;
        }
      }

      console.log(`  -> OK`);
    }

    console.log("\n=============================");
    console.log("AUDIT RESULTS");
    console.log("=============================");
    if (brokenLinks.length === 0) {
      console.log("All CTAs and links are working perfectly!");
    } else {
      console.log(`${brokenLinks.length} broken links found:`);
      brokenLinks.forEach(b => console.log(`- ${b.link} : ${b.status}`));
    }

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await browser.close();
  }
})();
