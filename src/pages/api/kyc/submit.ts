// src/pages/api/kyc/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { withAuth } from '@/lib/withAuth'; // keeps your auth wrapper
import { promises as fs } from 'fs';

export const config = {
  api: { bodyParser: false },
};

type KycSubmitResponse = {
  code: 'KYC_SUBMITTED';
  message: string;
  submission_id: string;
};

// Lightweight parse helper that avoids strict formidable types
async function parseForm(req: NextApiRequest): Promise<{ fields: Record<string, string>; files: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ multiples: false });
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ fields: fields as Record<string, string>, files: files as Record<string, any> });
    });
  });
}

// Placeholder storage + db functions
async function storeFileSecure(userId: string, file: any): Promise<string> {
  // file may have .filepath (formidable v2) or .path (older)
  const path = file?.filepath ?? file?.path ?? null;
  const name = file?.originalFilename ?? file?.name ?? `upload_${Date.now()}`;
  if (path) {
    const buffer = await fs.readFile(path);
    // Replace with real storage logic (S3/GCS). Returning pseudo-reference for now.
    return `s3://kyc/${userId}/${Date.now()}_${name}`;
  }
  // no file path, return a placeholder or throw depending on your preference
  return `s3://kyc/${userId}/${Date.now()}_nofile`;
}
async function saveKycSubmissionToDb(payload: { userId: string; fields: Record<string, string>; file_refs: Record<string, string | null> }): Promise<{ id: string }> {
  return { id: `sub_${Date.now()}` };
}
async function enqueueKycVerificationJob(submissionId: string) {
  return;
}

async function handler(req: NextApiRequest, res: NextApiResponse<KycSubmitResponse | { code: string; message: string }>) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'Use POST' });

  const session = (req as any).session;
  if (!session?.userId) return res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });

  try {
    const { fields, files } = await parseForm(req);

    if (!fields.fullName || !fields.country || !fields.dob) {
      return res.status(400).json({
        code: 'INVALID_PAYLOAD',
        message: 'Missing required fields: fullName, country, dob',
      });
    }

    if (session.tid) {
      console.log(`KYC submitted for TID: ${session.tid}`);
    }

    const fileKeys: Record<string, string | null> = {};
    for (const key of Object.keys(files)) {
      const f = files[key];
      if (f) {
        const ref = await storeFileSecure(session.userId, f);
        fileKeys[key] = ref;
      } else {
        fileKeys[key] = null;
      }
    }

    const saved = await saveKycSubmissionToDb({
      userId: session.userId,
      fields,
      file_refs: fileKeys,
    });

    await enqueueKycVerificationJob(saved.id);

    return res.status(202).json({
      code: 'KYC_SUBMITTED',
      message: 'KYC submitted and pending verification',
      submission_id: saved.id,
    });
  } catch (err) {
    console.error('KYC submit error', err);
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Unable to accept KYC submission' });
  }
}

export default withAuth(handler);
