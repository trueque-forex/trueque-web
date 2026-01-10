import type { NextApiRequest, NextApiResponse } from 'next';

type ConfigStatus = {
    holiday_mode: string | null;
    server_time: string;
};

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<ConfigStatus>
) {
    // Expose the HOLIDAY_MODE env var to the frontend
    // This allows the frontend to align fee calculations with the backend
    const holidayMode = process.env.HOLIDAY_MODE || null;

    res.status(200).json({
        holiday_mode: holidayMode,
        server_time: new Date().toISOString()
    });
}
