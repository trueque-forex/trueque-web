import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable-serverless';
import fs from 'fs';
import { getSession } from '../../../lib/session';
import { saveFile } from '../../../lib/storage';
import { query } from '../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

// Next.js config to disable default body parser for formidable
export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session?.userId) return res.status(401).json({ error: 'Authentication required' });

  if (req.method !== 'POST') return res.status(405).end();

  const form = new formidable.IncomingForm();
  const parsed = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
    form.parse(req as any, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
  });

  const file = parsed.files?.file;
  const type = parsed.fields?.type || 'id';
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  // read file buffer
  const buffer = fs.readFileSync((file as any).path);
  const saved = await saveFile(buffer, (file as any).name || 'upload.bin');

  // create or update submission
  const userId = session.userId;
  // create a new submission and attach file
  const submissionId = uuidv4();
  await query(
    `INSERT INTO kyc_submissions (id, user_id, status, created_at) VALUES ($1, $2, $3, now())`,
    [submissionId, userId, 'pending']
  );

  // insert file record
  const fileId = uuidv4();
  await query(
    `INSERT INTO kyc_files (id, submission_id, user_id, file_type, storage_path, url, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
    [fileId, submissionId, userId, type, saved.path, saved.url, 'uploaded']
  );

  // audit log
  await query(
    `INSERT INTO kyc_audit_logs (id, user_id, submission_id, action, metadata, created_at)
     VALUES ($1, $2, $3, $4, $5, now())`,
    [uuidv4(), userId, submissionId, 'file_uploaded', JSON.stringify({ fileId, type, storage: saved.path })]
  );

  // update user_kyc_status quick lookup
  await query(
    `INSERT INTO user_kyc_status (user_id, tier, status, last_updated) 
     VALUES ($1, $2, $3, now())
     ON CONFLICT (user_id) DO UPDATE SET status = EXCLUDED.status, last_updated = EXCLUDED.last_updated`,
    [userId, null, 'pending']
  );

  return res.status(200).json({ submissionId, fileId, url: saved.url });
}
