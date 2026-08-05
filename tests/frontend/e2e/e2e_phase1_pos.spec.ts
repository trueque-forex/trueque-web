const { test, expect } = require('@playwright/test');
const { Client } = require('pg');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres.kmxzxucfawlhqyglyfjr:SymmetriStart2026@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

test.describe('Phase 1: Synthetic Liquidity & POS Lifecycle', () => {
    let pgClient;
    let merchantUserId;
    let retailerId;
    let startLiquidity = 1000.00;
    
    test.beforeAll(async () => {
        pgClient = new Client({ connectionString: DB_URL });
        await pgClient.connect();
        
        // Find existing test user to copy password hash
        const resUser = await pgClient.query(`SELECT password_hash FROM users WHERE email = 'us_test@symmetri.dev' LIMIT 1`);
        const passHash = resUser.rows[0].password_hash;

        // Ensure merchant user
        let merchant = await pgClient.query(`SELECT id FROM users WHERE email = 'merchant@symmetri.dev' LIMIT 1`);
        if (merchant.rows.length === 0) {
            await pgClient.query(`INSERT INTO users (id, first_name, last_name, symmetri_id, email, password_hash, user_type, kyc_status) VALUES (gen_random_uuid(), 'Test', 'Merchant', '@merchanttest', 'merchant@symmetri.dev', $1, 'MERCHANT', 'APPROVED')`, [passHash]);
            merchant = await pgClient.query(`SELECT id FROM users WHERE email = 'merchant@symmetri.dev' LIMIT 1`);
        }
        merchantUserId = merchant.rows[0].id;
        
        // Ensure merchant profile
        let mProf = await pgClient.query(`SELECT id FROM merchants WHERE user_id = $1 LIMIT 1`, [merchantUserId]);
        if (mProf.rows.length === 0) {
            await pgClient.query(`INSERT INTO merchants (id, user_id, business_name, contact_email) VALUES (gen_random_uuid(), $1, 'Test Business', 'merchant@symmetri.dev')`, [merchantUserId]);
            mProf = await pgClient.query(`SELECT id FROM merchants WHERE user_id = $1 LIMIT 1`, [merchantUserId]);
        }
        const merchantProfileId = mProf.rows[0].id;

        // Ensure retailer
        let ret = await pgClient.query(`SELECT id FROM retailers WHERE merchant_id = $1 LIMIT 1`, [merchantProfileId]);
        if (ret.rows.length === 0) {
            await pgClient.query(`INSERT INTO retailers (id, merchant_id, name, country, currency) VALUES ('RET-TEST-1', $1, 'Test Retailer', 'US', 'USD')`, [merchantProfileId]);
            ret = await pgClient.query(`SELECT id FROM retailers WHERE merchant_id = $1 LIMIT 1`, [merchantProfileId]);
        }
        retailerId = ret.rows[0].id;

        // Ensure synthetic liquidity starts fresh
        let liq = await pgClient.query(`SELECT id FROM synthetic_liquidity WHERE retailer_id = $1 LIMIT 1`, [retailerId]);
        if (liq.rows.length === 0) {
            await pgClient.query(`INSERT INTO synthetic_liquidity (id, retailer_id, available_balance, currency) VALUES (gen_random_uuid(), $1, $2, 'USD')`, [retailerId, startLiquidity]);
        } else {
            await pgClient.query(`UPDATE synthetic_liquidity SET available_balance = $2 WHERE retailer_id = $1`, [retailerId, startLiquidity]);
        }

        // Ensure there is at least one unallocated $20 voucher for this retailer
        await pgClient.query(`
            INSERT INTO inventory_vouchers (id, retailer_id, barcode_data, value_amount, currency, is_allocated, is_voided)
            VALUES (gen_random_uuid(), $1, 'VOUCHER-' || gen_random_uuid(), 20.00, 'USD', false, false)
        `, [retailerId]);
    });

    test.afterAll(async () => {
        await pgClient.end();
    });

    test('E2E Lifecycle', async ({ browser }) => {
        test.setTimeout(120000); // Allow time for Next.js dev server compilation
        const context = await browser.newContext();
        let page = await context.newPage();

        // 1. GENERATION - Login as Consumer
        await page.goto('/signin');
        await page.fill('input[type="email"]', 'us_test@symmetri.dev');
        await page.fill('input[type="password"]', 'uS_test!234');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL('**/dashboard*');

        // Go to Voucher creation
        await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/auth/session')),
            page.goto('/voucher')
        ]);
        
        // Step 1: Select Retailer (Wait for first button)
        await page.locator('button', { hasText: '›' }).first().click();

        // Step 2: Amount + Payment
        await page.fill('input[id="voucher-amount-input"]', '20.00');
        // Choose Zelle
        await page.locator('button', { hasText: 'Zelle' }).click();
        await page.check('input[id="zelle-confirmed-checkbox"]');
        
        // Add Beneficiary
        await page.locator('button', { hasText: 'Add Beneficiary' }).click();

        // Step 3: Beneficiary Info
        await page.fill('input[placeholder="First and Last Name"]', 'Test Beneficiary');
        await page.fill('input[placeholder="10-digit number"]', '5551234567');
        await page.locator('button', { hasText: 'Review & Confirm' }).click();

        // Step 4: Confirm
        await page.locator('button', { hasText: 'Purchase Voucher' }).click();

        // Wait for success
        await page.waitForURL('**/voucher-success*', { timeout: 15000 });
        
        // Get Voucher Code from the UI or URL
        const url = new URL(page.url());
        const voucherCode = url.searchParams.get('code');
        expect(voucherCode).toBeTruthy();

        // 2. LIQUIDITY CHECK - Verify backend DB deducted balance by 20.00
        const liqCheck = await pgClient.query(`SELECT available_balance FROM synthetic_liquidity WHERE retailer_id = $1`, [retailerId]);
        const newBalance = parseFloat(liqCheck.rows[0].available_balance);
        expect(newBalance).toBe(startLiquidity - 20.00);

        // Clear context to simulate login as Merchant
        await context.close();
        
        // 3. REDEMPTION - Login as Merchant
        const merchantContext = await browser.newContext();
        const mPage = await merchantContext.newPage();

        await mPage.goto('/signin');
        await mPage.fill('input[type="email"]', 'merchant@symmetri.dev');
        await mPage.fill('input[type="password"]', 'uS_test!234'); // Same password hash as us_test
        await mPage.click('button:has-text("Sign In")');
        await mPage.waitForURL('**/dashboard*');

        // Navigate directly to Point of Sale
        await mPage.goto('/merchant/pos');
        await mPage.waitForURL('**/merchant/pos*');
        // Input Voucher Code
        await mPage.fill('input[placeholder="e.g. VOUCHER-12345"]', voucherCode);
        await mPage.click('button:has-text("Redeem Voucher")');

        // Wait for success message
        await mPage.waitForSelector('text=Voucher successfully redeemed!', { timeout: 10000 });

        // 4. FINAL STATE CHECK - Verify DB
        const vCheck = await pgClient.query(`
            SELECT t.status 
            FROM transactions t 
            JOIN inventory_vouchers v ON v.transaction_id = t.id 
            WHERE v.barcode_data = $1
        `, [voucherCode]);
        expect(vCheck.rows[0].status).toBe('REDEEMED');

        await merchantContext.close();
    });
});
