// src/pages/api/offers/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Helper to generate a mock Trueque ID
const getMockTruequeID = (country: string, index: number) => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(index + 1).padStart(4, '0');
    return `T${date}${country}${seq}X`;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).end();
    }

    const { amount, currencyFrom, currencyTo } = req.query;

    // Check required params (loose check for mocks)
    const targetAmount = parseFloat(amount as string) || 100000;
    const cFrom = (currencyFrom as string) || 'EUR';
    const cTo = (currencyTo as string) || 'ARS';
    const marketRate = 1050.00; // Mock rate

    // Mock Profiles
    const baseProfiles = [
        { country: 'AR', min: 10, max: 500, trust: 4.8 },
        { country: 'MX', min: 50, max: 1000, trust: 4.9 },
        { country: 'CO', min: 100, max: 2000, trust: 4.7 },
        { country: 'BR', min: 20, max: 300, trust: 4.6 },
        { country: 'US', min: 200, max: 5000, trust: 5.0 },
    ];

    const offers = [];

    // Always inject specific test offers for Sandbox Verification (ES -> AR)
    if (cTo === 'ARS') {
        // Offer 1: 120,000 ARS
        offers.push({
            id: 'OFF120000ARS1',
            provider: getMockTruequeID('AR', 100),
            amount: 120000,
            rate: marketRate,
            min: 10,
            max: 500,
            speed: 'Instant',
            trust: 4.8,
            offerAmount: 120000,
            currencyFrom: cFrom,
            currencyTo: cTo,
            marketRate: marketRate,
            isRound: true
        });

        // Offer 2: 250,000 ARS (Restricted)
        offers.push({
            id: 'OFF250000ARS2',
            provider: getMockTruequeID('MX', 200),
            amount: 250000,
            rate: marketRate,
            min: 50,
            max: 1000,
            speed: 'Instant',
            trust: 4.9,
            offerAmount: 250000,
            currencyFrom: cFrom,
            currencyTo: cTo,
            marketRate: marketRate,
            isRound: false
        });

        // Offer 3: 1,000,000 ARS (Restricted)
        offers.push({
            id: 'OFF1000000ARS3',
            provider: getMockTruequeID('US', 300),
            amount: 1000000,
            rate: marketRate,
            min: 100,
            max: 5000,
            speed: 'Instant',
            trust: 5.0,
            offerAmount: 1000000,
            currencyFrom: cFrom,
            currencyTo: cTo,
            marketRate: marketRate,
            isRound: true
        });
    } else {
        // Generic fill for non-ARS
        offers.push({
            id: 'OFFGEN1',
            provider: getMockTruequeID('US', 999),
            amount: targetAmount,
            rate: 1.0,
            min: 0,
            max: 10000,
            speed: 'Instant',
            trust: 4.5,
            offerAmount: targetAmount,
            currencyFrom: cFrom,
            currencyTo: cTo,
            marketRate: 1.0,
            isRound: true
        });
    }

    return res.status(200).json(offers);
}
