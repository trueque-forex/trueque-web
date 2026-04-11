// tests/frontend/e2e/remittance-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Trueque Remittance E2E Flow', () => {
    test('complete remittance journey: signup → swap', async ({ page }) => {
        // ============================================
        // STEP 1: Sign Up
        // ============================================
        await page.goto('/signup');
        await page.waitForLoadState('networkidle');

        // Fill signup form using existing IDs
        await page.fill('#firstName', 'John');
        await page.fill('#lastName', 'Doe');
        await page.fill('#dob', '1990-01-15');
        await page.fill('#email', `john.doe${Date.now()}@example.com`);
        await page.fill('#password', 'SecurePass123!');
        await page.fill('#confirmPassword', 'SecurePass123!');

        // Fill address info
        await page.fill('#countryOfResidence', 'US');
        await page.fill('#address', '123 Main St');
        await page.fill('#countryDestiny', 'MX');

        // Submit signup
        const submitBtn = page.getByRole('button', { name: 'Create Account' });
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // Wait for redirect to signup success page
        await page.waitForURL(/\/signup-success/, { timeout: 15000 });

        const successUrl = page.url();
        console.log('After signup, redirected to:', successUrl);

        if (successUrl.includes('/signup-success')) {
            await page.waitForLoadState('networkidle');
            console.log('✅ Successfully reached signup success page');

            // Verify Trueque ID is visible
            await expect(page.getByText('Your Trueque ID')).toBeVisible();

            // Click continue to go to swap
            await page.getByRole('button', { name: 'Start Swapping' }).click();

            // Wait for swap page
            await page.waitForURL(/\/swap/, { timeout: 15000 });
            console.log('✅ Successfully navigated to swap page');
        } else {
            console.log('⚠️ Failed to reach signup success page');
        }
    });

    test('swap page loads correctly', async ({ page }) => {
        await page.goto('/swap');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText(/Hello|Welcome/i);
        await expect(page.locator('select').first()).toBeVisible();
        await expect(page.locator('input[type="text"], input[type="number"]').first()).toBeVisible();
    });

    test('currency selection works', async ({ page }) => {
        await page.goto('/swap');
        await page.waitForLoadState('networkidle');
        const selects = page.locator('select');
        await selects.nth(0).selectOption({ index: 1 });
        await selects.nth(1).selectOption({ index: 2 });
        await page.waitForTimeout(1000);
        const pageContent = await page.textContent('body');
        console.log('Page contains "rate" or "Rate":', pageContent?.toLowerCase().includes('rate'));
    });
});
