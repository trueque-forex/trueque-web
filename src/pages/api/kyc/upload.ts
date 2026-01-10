// src/pages/api/kyc/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { withAuth } from '@/lib/withAuth';
import { saveFile } from '@/lib/storage';
import { query } from '@/lib/server/db';
import { v4 as uuidv4 } from 'uuid';
import { TruequeSession } from '@/types/auth';

export const config = { api: { bodyParser: false } };

// Small helper to parse multipart form with formidable (promise wrapper)
async function parseForm(req: NextApiRequest): Promise<{ fields: Record<string, any>; files: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ multiples: false });
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ fields: fields ?? {}, files: files ?? {} });
    });
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const session = (req as any).session as TruequeSession;

  try {
    const { fields, files } = await parseForm(req);

    const incoming = files?.file ?? files?.document ?? null;
    if (!incoming) return res.status(400).json({ error: 'No file uploaded' });

    // formidable v2 uses `filepath`, older versions used `path`
    const filePath: string | null = incoming.filepath ?? (incoming.path as string) ?? null;
    const originalName: string = incoming.originalFilename ?? incoming.name ?? 'upload.bin';

    if (!filePath) return res.status(400).json({ error: 'Uploaded file is not accessible' });

    // read file buffer
    const buffer = await fs.readFile(filePath);

    // persist to storage (saveFile should return { path, url } or similar)
    const saved = await saveFile(buffer, originalName);

    // create submission + file records
    const userId = session.user.id;
    const submissionId = uuidv4();

    await query(
      `INSERT INTO kyc_submissions (id, user_id, status, created_at) VALUES ($1, $2, $3, now())`,
      [submissionId, userId, 'pending']
    );

    const fileId = uuidv4();
    await query(
      `INSERT INTO kyc_files (id, submission_id, user_id, file_type, storage_path, url, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
      [fileId, submissionId, userId, fields?.type ?? 'id', saved.path, saved.url, 'uploaded']
    );

    await query(
      `INSERT INTO kyc_audit_logs (id, user_id, submission_id, action, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, now())`,
      [uuidv4(), userId, submissionId, 'file_uploaded', JSON.stringify({ fileId, type: fields?.type ?? 'id', storage: saved.path })]
    );

    await query(
      `INSERT INTO user_kyc_status (user_id, tier, status, last_updated)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, last_updated = EXCLUDED.last_updated`,
      [userId, null, 'pending']
    );

    return res.status(200).json({ submissionId, fileId, url: saved.url });
  } catch (err: any) {
    console.error('kyc.upload error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
}

export default withAuth(handler);
