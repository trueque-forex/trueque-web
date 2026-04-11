// src/pages/api/kyc/retry.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';

// Helper to parse formidable forms using a Promise
function parseForm(req: NextApiRequest): Promise<{ fields: Record<string, any>; files: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ multiples: false });
    form.parse(req, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ fields: fields as Record<string, any>, files: files as Record<string, any> });
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseForm(req);

    // Defensive: validate expected fields
    const id = String(fields.id || '');
    if (!id) return res.status(400).json({ error: 'Missing id field' });

    // Example file handling: if a file was uploaded under 'document'
    const incomingFile = files?.document ?? files?.file ?? null;

    // formidable versions differ: some provide `filepath`, others `path`
    const filePath: string | null =
      incomingFile && (incomingFile.filepath ?? (incomingFile.path as string) ?? null);

    if (filePath) {
      // Read the file to ensure it's accessible (non-blocking)
      const buffer = await fs.readFile(filePath);

      // In your real flow you'd forward this buffer to storage (S3, GCS, etc.)
      // For now we return file size and original filename to confirm receipt
      return res.status(200).json({
        status: 'ok',
        message: 'KYC retry received',
        id,
        filename: incomingFile.originalFilename ?? incomingFile.name ?? null,
        size: buffer.length,
      });
    }

    return res.status(200).json({ status: 'ok', message: 'KYC retry received', id });
  } catch (err: unknown) {
    console.error('KYC retry error', err);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
