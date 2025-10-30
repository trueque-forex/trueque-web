<<<<<<< HEAD
// pages/api/kyc/retry.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";

export const config = { api: { bodyParser: false } };

async function parseForm(req: NextApiRequest) {
  return new Promise<{ fields: Record<string, string>; files: Record<string, File> }>((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields: fields as Record<string, string>, files: files as Record<string, File> });
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    });
  });
}

<<<<<<< HEAD
async function getUserFromReq(req: NextApiRequest) {
  return (req as any).user ?? null;
}

// Placeholder DB functions
async function saveKycRetrySubmission(payload: { userId: string; fields: Record<string, string>; file_refs: Record<string, string | null> }) {
  return { id: `retry_${Date.now()}` };
}
async function storeFileSecure(userId: string, file: File): Promise<string> {
  return `s3://kyc-retry/${userId}/${Date.now()}_${file.name}`;
}
async function enqueueKycRetryJob(submissionId: string) {
  return;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Use POST" });

  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ message: "Authentication required" });
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

  try {
    const { fields, files } = await parseForm(req);

<<<<<<< HEAD
    // Accept either explicit reason or other fields; require id_document and selfie files
    const idFile = files.id_document;
    const selfie = files.selfie;
    if (!idFile || !selfie) {
      return res.status(400).json({ message: "id_document and selfie files are required for retry" });
    }

    const fileRefs: Record<string, string | null> = {};
    for (const k of Object.keys(files)) {
      const f = files[k] as File | undefined;
      fileRefs[k] = f ? await storeFileSecure(user.id, f) : null;
    }

    const saved = await saveKycRetrySubmission({ userId: user.id, fields, file_refs: fileRefs });
    await enqueueKycRetryJob(saved.id);

    // Return a minimal result; worker will update verification state
    return res.status(200).json({ verified: false, submission_id: saved.id });
  } catch (err) {
    console.error("KYC retry error", err);
    return res.status(500).json({ message: "Unable to accept retry submission" });
  }
}
=======
    // Defensive: validate expected fields
    const userId = String(fields.userId || '');
    if (!userId) return res.status(400).json({ error: 'Missing userId field' });

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
        userId,
        filename: incomingFile.originalFilename ?? incomingFile.name ?? null,
        size: buffer.length,
      });
    }

    return res.status(200).json({ status: 'ok', message: 'KYC retry received', userId });
  } catch (err: unknown) {
    console.error('KYC retry error', err);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
