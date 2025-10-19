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
    });
  });
}

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

  try {
    const { fields, files } = await parseForm(req);

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
