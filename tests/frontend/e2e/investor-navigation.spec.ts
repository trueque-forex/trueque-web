import { test, expect } from '@playwright/test';

test.describe('Symmetri Phase 2 Funnel Navigation (Real DB State)', () => {

  // Give the dev server some breathing room for compilations and real DB queries
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    // 1. Bypass middleware
    await page.goto('/?access=Vamos2026');

    // 2. Perform real login against the DB
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'vamos@symmetri.com');
    await page.fill('input[type="password"]', 'Vamos2026!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for real authentication redirect
    await page.waitForURL('**/dashboard**', { timeout: 30000 });
  });

  test('Forward, Back, and Cancel routing', async ({ page }) => {
    // 3. Start at Offers (we assume some offers exist in the local DB. If not, this step will correctly fail to find an 'Accept' button, flagging a data dependency for the VC pitch).
    await page.goto('/offers?from=USD&to=MXN');
    
    // 4. Click Accept -> Route to Beneficiary Selection
    const acceptBtn = page.locator('button:has-text("Accept")').first();
    console.log('Current URL:', page.url());
    console.log('Page content:', await page.content());
    await expect(acceptBtn).toBeVisible({ timeout: 15000 });
    await acceptBtn.click();

    await page.waitForURL('**/beneficiary-selection**', { timeout: 15000 });
    expect(page.url()).toContain('/beneficiary-selection');

    // 5. Click "New Recipient" to go to create beneficiary (which is part of Select Beneficiary)
    const newRecipientBtn = page.locator('text=New Recipient');
    await expect(newRecipientBtn).toBeVisible({ timeout: 15000 });
    await newRecipientBtn.click();
    
    await page.waitForURL('**/beneficiary**', { timeout: 15000 });
    expect(page.url()).toContain('/beneficiary');

    // 6. Fill out Beneficiary Form for MXN
    await page.fill('input[placeholder="e.g. Maria"]', 'Test');
    await page.fill('input[placeholder="e.g. Gonzalez"]', 'User');
    await page.fill('input[placeholder="Mobile Number"]', '5551234567');
    await page.fill('input[placeholder="maria@example.com"]', 'test@example.com');
    await page.fill('input[placeholder="18 digits"]', '123456789012345678');
    await page.fill('input[placeholder="Full Name"]', 'Test User');
    
    // Proceed to Review (Funding Method Screen)
    await page.locator('button:has-text("Review & Confirm")').click();
    await page.waitForURL('**/review**', { timeout: 15000 });
    expect(page.url()).toContain('/review');

    // 7. Test Back Button from Funding Screen -> Route back to Beneficiary Selection
    await page.locator('button:has-text("Back")').click();
    await page.waitForURL('**/beneficiary-selection**', { timeout: 15000 });
    expect(page.url()).toContain('/beneficiary-selection');

    // 8. Go Forward to Review again to test Cancel
    // Since we saved it, we can click the saved beneficiary card
    await page.locator('text=Test User').first().click();
    await page.waitForURL('**/review**', { timeout: 15000 });
    
    // 9. Test Cancel Transaction -> Route back to Dashboard
    await page.locator('button:has-text("Cancel Transaction")').click();
    await page.locator('button:has-text("Yes, Cancel")').click();
    
    // Wait for the real navigation
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');
    
    // Assert the state was cleared successfully from real localStorage
    const persistentState = await page.evaluate(() => localStorage.getItem('trueque_swap_state_persistent'));
    expect(persistentState).toBeNull();
  });

});
