// tests/frontend/e2e/helpers.ts
import { Page } from '@playwright/test';

export async function loginUser(page: Page, email: string, password: string) {
    await page.goto('/signin');
    await page.fill('input[id="identifier"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/\/swap|\/dashboard/, { timeout: 10000 });
}

export async function createSwapOffer(
    page: Page,
    fromCurrency: string,
    toCurrency: string,
    amount: string,
    timeframeHours: number
) {
    await page.goto('/swap');
    await page.selectOption('select[name="currencyFrom"]', fromCurrency);
    await page.selectOption('select[name="currencyTo"]', toCurrency);
    await page.fill('input[placeholder*="amount"]', amount);
    await page.selectOption('select[name="timeFrame"]', timeframeHours.toString());
    await page.click('button:has-text("Find Offers")');
}

export async function waitForMSW(page: Page) {
    await page.waitForFunction(
        () => !!(window as any).__MSW_WORKER__ || !!(window as any).__MSW_SET_SCENARIO
    );
}

export function generateTestEmail() {
    return `test.${Date.now()}@example.com`;
}

export function generateTestUsername() {
    return `testuser${Date.now()}`;
}
