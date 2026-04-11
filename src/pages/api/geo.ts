import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || '127.0.0.1';

        // Default to US
        let country = 'US';

        // In a real deployed environment, we might trust headers from the edge
        if (req.headers['x-vercel-ip-country']) {
            country = req.headers['x-vercel-ip-country'] as string;
        } else if (req.headers['cf-ipcountry']) {
            country = req.headers['cf-ipcountry'] as string;
        } else if (ip && ip !== '127.0.0.1' && ip !== '::1') {
            // Try external service
            try {
                const geoReq = await fetch(`http://ip-api.com/json/${ip}`);
                if (geoReq.ok) {
                    const geoData = await geoReq.json();
                    if (geoData.countryCode) {
                        country = geoData.countryCode;
                    }
                }
            } catch (e) {
                console.warn('Geo lookup failed', e);
            }
        }

        res.status(200).json({ country, ip });
    } catch (error) {
        console.error('Geo API Error', error);
        res.status(200).json({ country: 'US', ip: 'unknown' });
    }
}
