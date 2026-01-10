import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Read the shared backend config
        const configPath = path.join(process.cwd(), 'backend', 'config', 'corridor_config.json');
        if (!fs.existsSync(configPath)) {
            return res.status(404).json({ error: 'Config not found' });
        }

        const fileContents = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(fileContents);

        // Return the countries dictionary
        res.status(200).json(config.countries || {});
    } catch (error) {
        console.error('Failed to load corridor config:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
