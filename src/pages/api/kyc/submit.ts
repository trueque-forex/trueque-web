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
  message: string;
  submission_id: string;
};

async function parseForm(req: NextApiRequest) {
  return new Promise<{ fields: Record<string, string>; files: Record<string, File> }>((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields: fields as Record<string, string>, files: files as Record<string, File> });
    });
  });
}

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

  try {
    const { fields, files } = await parseForm(req);

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
        fileKeys[key] = ref;
      } else {
        fileKeys[key] = null;
      }
    }

    const saved = await saveKycSubmissionToDb({ userId: user.id, fields, file_refs: fileKeys });

    // Enqueue verification (async)
    await enqueueKycVerificationJob(saved.id);

    return res.status(202).json({ code: "KYC_SUBMITTED", message: "KYC submitted and pending verification", submission_id: saved.id });
  } catch (err) {
    console.error("KYC submit error", err);
    return res.status(500).json({ code: "SERVER_ERROR", message: "Unable to accept KYC submission" });
  }
}
