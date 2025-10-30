<<<<<<< HEAD
// pages/api/kyc/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

type KycSubmitResponse = {
  code: "KYC_SUBMITTED";
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  message: string;
  submission_id: string;
};

<<<<<<< HEAD
async function parseForm(req: NextApiRequest) {
  return new Promise<{ fields: Record<string, string>; files: Record<string, File> }>((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields: fields as Record<string, string>, files: files as Record<string, File> });
=======
// Lightweight parse helper that avoids strict formidable types
async function parseForm(req: NextApiRequest): Promise<{ fields: Record<string, string>; files: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ multiples: false });
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ fields: fields as Record<string, string>, files: files as Record<string, any> });
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    });
  });
}

<<<<<<< HEAD
// Placeholder auth helper - implement according to your auth (cookies, session, jwt)
async function getUserFromReq(req: NextApiRequest) {
  // Example: return { id: 'user_123' } or null
  return (req as any).user ?? null;
}

// Placeholder storage + db functions
async function storeFileSecure(userId: string, file: File): Promise<string> {
  // Upload to private object storage and return a reference/key
  // Implement: stream file.path to S3/GCS and return the object key
  return `s3://kyc/${userId}/${Date.now()}_${file.name}`;
}
async function saveKycSubmissionToDb(payload: {
  userId: string;
  fields: Record<string, string>;
  file_refs: Record<string, string | null>;
}): Promise<{ id: string }> {
  // Persist submission and return record id
  return { id: `sub_${Date.now()}` };
}
async function enqueueKycVerificationJob(submissionId: string) {
  // Push job to verification queue/worker
  return;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<KycSubmitResponse | { code: string; message: string }>) {
  if (req.method !== "POST") return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "Use POST" });

  const user = await getUserFromReq(req);
  if (!user) return res.status(401).json({ code: "UNAUTHENTICATED", message: "Authentication required" });
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

  try {
    const { fields, files } = await parseForm(req);

<<<<<<< HEAD
    // Basic required fields check
    if (!fields.fullName || !fields.country || !fields.idNumber) {
      return res.status(400).json({ code: "INVALID_PAYLOAD", message: "Missing required fields: fullName, country, idNumber" });
    }

    // Store files securely and build file_refs map
    const fileKeys: Record<string, string | null> = {};
    for (const key of Object.keys(files)) {
      const f = files[key] as File | undefined;
      if (f) {
        const ref = await storeFileSecure(user.id, f);
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        fileKeys[key] = ref;
      } else {
        fileKeys[key] = null;
      }
    }

<<<<<<< HEAD
    const saved = await saveKycSubmissionToDb({ userId: user.id, fields, file_refs: fileKeys });

    // Enqueue verification (async)
    await enqueueKycVerificationJob(saved.id);

    return res.status(202).json({ code: "KYC_SUBMITTED", message: "KYC submitted and pending verification", submission_id: saved.id });
  } catch (err) {
    console.error("KYC submit error", err);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to accept KYC submission" });
  }
}
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
