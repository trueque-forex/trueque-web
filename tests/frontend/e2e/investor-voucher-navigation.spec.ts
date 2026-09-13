import { test, expect } from '@playwright/test';
import { loginUser } from './helpers';

test.describe('Symmetri Phase 1 Voucher Navigation (Real DB State)', () => {
  // Use a unique session for each test to avoid state bleeding
  test.use({ storageState: { cookies: [], origins: [] } });
  test('Forward, Back, and Cancel routing', async ({ page }) => {
    // 0. Bypass middleware with access link
    await page.goto('/?access=Vamos2026');

    // 1. Perform Real UI Login
    await loginUser(page, 'vamos@symmetri.com', 'Vamos2026!');

    // 2. Go to Vouchers page
    await page.goto('/vouchers');
    
    // Wait for the page to load
    await expect(page.locator('h1:has-text("My Vouchers")')).toBeVisible({ timeout: 15000 });

    // 3. Start New Voucher Flow
    await page.locator('button:has-text("Send New Voucher")').click();
    await page.waitForURL('**/voucher**', { timeout: 15000 });

    // 4. Select Retailer (Step 1)
    // Wait for countries/retailers to load
    await expect(page.locator('text=Choose Retailer')).toBeVisible({ timeout: 10000 });
    // Click the first retailer in the list
    await page.locator('button:has-text("›")').first().click();

    // 5. Select Amount & Payment Method (Step 2)
    // Wait for Step 2 to render
    await expect(page.locator('label:has-text("Beneficiary receives")')).toBeVisible({ timeout: 10000 });
    
    // Fill Amount
    await page.fill('input[type="number"]', '50');

    // Fill Payment Form (if not using saved)
    // Since it's a real user, they might have a saved payment. We try to add a new card if needed, or use saved.
    const isUsingSaved = await page.locator('text=Saved payment method').isVisible();
    if (!isUsingSaved) {
      await page.locator('text=Debit Card').first().click();
      await page.fill('input[placeholder="John Doe"]', 'Vamos Pitch');
      await page.fill('input[placeholder="Card Number"]', '4242424242424242');
      await page.fill('input[placeholder="MM/YY"]', '12/28');
      await page.fill('input[placeholder="CVV"]', '123');
      await page.locator('button:has-text("Verify & Tokenize Card")').click();
    }

    await page.locator('button:has-text("Add Beneficiary →")').click();

    // 6. Beneficiary Info (Step 3)
    await expect(page.locator('text=Who receives this voucher?')).toBeVisible({ timeout: 10000 });
    
    // If no saved beneficiaries, add one inline
    const hasSavedBen = await page.locator('text=Phone Only').count() > 0 || await page.locator('text=Test User').count() > 0;
    if (!hasSavedBen) {
      await page.locator('button:has-text("+ Add Beneficiary")').first().click();
      await page.fill('input[placeholder="e.g., Maria Lopez"]', 'Voucher Receiver');
      await page.fill('input[placeholder="+52 123 456 7890"]', '5551234567');
      await page.locator('button:has-text("Save Beneficiary")').click();
    } else {
      // Click the first saved beneficiary
      await page.locator('div.cursor-pointer').first().click();
    }

    await page.locator('button:has-text("Review & Confirm →")').click();

    // 7. Confirm (Step 4)
    await expect(page.locator('text=Confirm Your Voucher')).toBeVisible({ timeout: 10000 });

    // 8. Test Back Button -> Route back to Step 3 (Beneficiary)
    await page.locator('button:has-text("← Edit")').click();
    await expect(page.locator('text=Who receives this voucher?')).toBeVisible({ timeout: 10000 });

    // Go forward to Confirm again
    await page.locator('button:has-text("Review & Confirm →")').click();
    await expect(page.locator('text=Confirm Your Voucher')).toBeVisible({ timeout: 10000 });

    // 9. Test Cancel Transaction -> Route back to Dashboard
    // Accept the confirm dialog automatically
    page.on('dialog', dialog => dialog.accept());
    
    await page.locator('button:has-text("Cancel Transaction")').click();
    
    // Wait for the real navigation
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
  });
});
