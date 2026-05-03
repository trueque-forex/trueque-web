import { test, expect } from '@playwright/test';

test.describe('Flow A: New User Journey', () => {
    test('complete signup -> kyc -> swap -> beneficiary sequence', async ({ page }) => {
        // 1. Discovery
        await page.goto('/');
        await expect(page.getByText('Welcome to Trueque')).toBeVisible();

        // 2. Sign Up
        await page.getByRole('button', { name: 'Get Started' }).click();
        await page.waitForURL('**/signin');
        await page.getByText('Create an account').click();
        await page.waitForURL('**/signup');

        // Fill Signup Form
        const uniqueEmail = `test.flowa.${Date.now()}@trueque.dev`;
        await page.locator('#firstName').fill('New');
        await page.locator('#lastName').fill('User');
        await page.locator('#dob').fill('1995-05-20');
        await page.locator('#email').fill(uniqueEmail);
        await page.locator('#password').fill('SecurePass123!');
        await page.locator('#confirmPassword').fill('SecurePass123!');
        await page.locator('#countryOfResidence').selectOption('US');
        await page.locator('#address').fill('123 Test St');
        await page.locator('#countryDestiny').selectOption('MX');

        await page.getByRole('button', { name: 'Create Account' }).click();

        // 3. Mandatory MFA Interception
        // Signup now auto-redirects to /auth/mfa
        await page.waitForURL('**/auth/mfa*');
        // Fill 6-digit code (any code works in dev mock except 000000, but logic in verify.ts accepts it)
        // Actually verify.ts logic says `if (code.length !== 6 || code === '000000')` error.
        // We'll enter '123456'.
        const inputs = page.locator('input[type="text"]'); // 6 inputs
        for (let i = 0; i < 6; i++) {
            await inputs.nth(i).fill(String(i + 1));
        }
        await page.getByRole('button', { name: 'Verify Identity' }).click();

        // 4. KYC Interaction (Redirected after MFA)
        await page.waitForURL('**/kyc?newUser=true*');

        // Step 1: Personal
        await page.locator('select').filter({ hasText: 'Nationality' }).selectOption('US');
        await page.locator('input[placeholder="Your current occupation"]').fill('Engineer'); // Occupation
        await page.getByText('Next').click();

        // Step 2: Address (Pre-filled or fill it)
        await page.locator('input[placeholder="Street Address"]').fill('123 Test St');
        await page.locator('input[placeholder="City"]').fill('Austin');
        await page.locator('input[placeholder="State/Province"]').fill('TX');
        await page.locator('input[placeholder="Zip/Postal Code"]').fill('78701');
        await page.locator('select').filter({ hasText: 'Country' }).selectOption('US'); // Explicitly select country if needed
        await page.getByText('Next').click();

        // Step 3: Documents
        await page.locator('input[placeholder="Document number"]').fill('123456789');
        await page.locator('select').filter({ hasText: 'Issuing Country' }).selectOption('US');
        await page.locator('input[type="date"]').nth(0).fill('2020-01-01'); // Issue
        await page.locator('input[type="date"]').nth(1).fill('2030-01-01'); // Expiry
        await page.getByText('Next').click();

        // Step 4: Verification / Consent
        await page.locator('input[type="checkbox"]').nth(0).check(); // Data processing
        await page.locator('input[type="checkbox"]').nth(1).check(); // Prototype agreement

        // Mock Submit Alert (We need to handle the dialog)
        page.on('dialog', dialog => dialog.accept());
        await page.getByText('Submit Verification').click();

        // 4. Redirect to Swap (returnTo)
        await page.waitForURL('**/swap*');
        await expect(page.getByText('Amount and Currency to Swap')).toBeVisible();

        // 5. Make Offer
        await page.locator('input[placeholder="0.00"]').fill('100');
        // Wait for rate logic?
        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Ready to Swap' }).click();

        // 6. Offers / Provider Select
        await page.waitForURL('**/offers*');
        // Click "Select" on first offer
        await page.getByRole('button', { name: 'Select' }).first().click();

        // 7. Beneficiary Details (Add New)
        await page.waitForURL('**/beneficiary*');
        await page.locator('input[placeholder="First Name"]').fill('Maria');
        await page.locator('input[placeholder="Last Name"]').fill('Garcia');
        await page.locator('input[placeholder="Email (Optional)"]').fill('maria@example.com');
        await page.locator('select').first().selectOption('Family'); // Relationship

        // Banking Method (e.g. Bank Transfer)
        // Ensure "Bank Transfer" is selected or click it
        // Then fill fields
        // Assume default is Bank Transfer for now or selector exists

        // Submit Beneficiary AND Auto-Save
        await page.getByText('Review Transaction').click();

        // 8. Review
        await page.waitForURL('**/review*');
        await expect(page.getByText('Review Transaction')).toBeVisible();

        // Check Transparency Table has amount
        await expect(page.getByText('100.00')).toBeVisible();
    });
});
