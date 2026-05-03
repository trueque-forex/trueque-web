import { test, expect } from '@playwright/test';

test.describe('Flow B: Returning User', () => {
    test('should allow storing a beneficiary and then quickly selecting them in a new session', async ({ page }) => {
        // 1. Discovery Page
        await page.goto('/');
        await expect(page.getByText('Welcome to Trueque')).toBeVisible();

        // 2. Sign In
        await page.getByRole('button', { name: 'Get Started' }).click();
        await page.waitForURL('**/signin');

        // Use valid dev user with NO MFA
        await page.locator('#email').fill('joao.teste@trueque.dev');
        await page.locator('#password').fill('jt123456');
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Mandatory MFA Step
        await page.waitForURL('**/auth/mfa*');
        const inputs = page.locator('input[type="text"]');
        for (let i = 0; i < 6; i++) {
            await inputs.nth(i).fill('1');
        }
        await page.getByRole('button', { name: 'Verify Identity' }).click();

        // 3. Beneficiary Selection Hub
        await page.waitForURL('**/beneficiary-selection');
        await expect(page.getByText('Who do you want to send money to today?')).toBeVisible();

        // 4. Mock Selection
        await page.route('/api/beneficiaries', async route => {
            const json = [{
                id: 'ben_123',
                name: 'Carlos Test',
                country: 'MX',
                method: 'bank_rtp',
                identifiers: { accountNumber: '1234567890' }
            }];
            await route.fulfill({ json });
        });

        // Reload to get the mocked beneficiary
        await page.goto('/beneficiary-selection');
        await expect(page.getByText('Carlos Test')).toBeVisible();
        await expect(page.getByText('•••• 7890')).toBeVisible(); // Last 4 digits check

        // Click the beneficiary
        await page.getByText('Carlos Test').click();

        // Should go to Swap WITH beneficiaryId
        await page.waitForURL('**/swap?beneficiaryId=ben_123*');

        // 5. Verify Back Button
        const backBtn = page.getByRole('button', { name: '←' });
        await expect(backBtn).toBeVisible();
        await backBtn.click();

        // Should return to Hub
        await page.waitForURL('**/beneficiary-selection');

        // 6. Sign Out
        await page.getByText('Sign Out').click();
        await page.waitForURL('/'); // Discovery
        await expect(page.getByText('Welcome to Trueque')).toBeVisible();

        // Verify Data Isolation (Session gone)
        const session = await page.evaluate(() => localStorage.getItem('trueque_session'));
        expect(session).toBeNull();
    });
});
