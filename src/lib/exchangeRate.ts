// src/lib/exchangeRate.ts

/**
 * Fetches real-time exchange rate from ExchangeRate-API
 * Free tier: 1,500 requests/month
 * https://www.exchangerate-api.com/
 */
export async function fetchExchangeRate(from: string, to: string): Promise<number> {
  try {
    // Using ExchangeRate-API (free tier, no API key needed for basic usage)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();

    if (!data.rates || !data.rates[to]) {
      throw new Error(`Exchange rate not available for ${from} to ${to}`);
    }

    return data.rates[to];
  } catch (error: any) {
    console.error('Exchange rate fetch error:', error);
    throw new Error(error.message || 'Unable to fetch exchange rate');
  }
}

/**
 * Alternative: Use Open Exchange Rates API (requires API key, more reliable)
 * Sign up at: https://openexchangerates.org/
 */
export async function fetchExchangeRateOpenER(from: string, to: string, apiKey: string): Promise<number> {
  try {
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=${from}&symbols=${to}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();

    if (!data.rates || !data.rates[to]) {
      throw new Error(`Exchange rate not available for ${from} to ${to}`);
    }

    return data.rates[to];
  } catch (error: any) {
    console.error('Exchange rate fetch error:', error);
    throw new Error(error.message || 'Unable to fetch exchange rate');
  }
}