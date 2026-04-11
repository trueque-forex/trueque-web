// src/pages/api/kyc/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { withAuth } from '@/lib/withAuth';
import { promises as fs } from 'fs';
import knexClient from '@/lib/knexClient';
import { issueTruequeIdForUser } from '@/server/kyc/issueTruequeId';

export const config = {
  api: { bodyParser: false },
};

type KycSubmitResponse = {
  code: 'KYC_SUBMITTED';
  message: string;
  submission_id: string;
  trade_mask_sid: string | null;
};

async function parseForm(req: NextApiRequest): Promise<{ fields: Record<string, string>; files: Record<string, any> }> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ multiples: false });
    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) return reject(err);
      resolve({ fields: fields as Record<string, string>, files: files as Record<string, any> });
    });
  });
}

async function storeFileSecure(userId: string, file: any): Promise<string> {
  const path = file?.filepath ?? file?.path ?? null;
  const name = file?.originalFilename ?? file?.name ?? `upload_${Date.now()}`;
  if (path) {
    await fs.readFile(path); // validate readable
    // TODO: replace with real S3/GCS upload
    return `s3://kyc/${userId}/${Date.now()}_${name}`;
  }
  return `s3://kyc/${userId}/${Date.now()}_nofile`;
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<KycSubmitResponse | { code: string; message: string }>
) {
  if (req.method !== 'POST') return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'Use POST' });

  const session = (req as any).session;
  const ownerId: string | undefined = session?.user?.id;
  if (!ownerId) return res.status(401).json({ code: 'UNAUTHENTICATED', message: 'Authentication required' });

  try {
    const { fields, files } = await parseForm(req);

    if (!fields.fullName || !fields.country || !fields.dob) {
      return res.status(400).json({
        code: 'INVALID_PAYLOAD',
        message: 'Missing required fields: fullName, country, dob',
      });
    }

    // Store documents (S3 placeholder — replace with real upload)
    const fileKeys: Record<string, string | null> = {};
    for (const key of Object.keys(files)) {
      const f = files[key];
      fileKeys[key] = f ? await storeFileSecure(ownerId, f) : null;
    }

    const submissionId = `sub_${Date.now()}`;

    // ── 1. Move user to PENDING and record KYC submission ──
    await knexClient('users')
      .where({ id: ownerId })
      .update({
        kyc_status: 'PENDING',
        kyc_submitted_at: knexClient.fn.now(),
        updated_at: knexClient.fn.now(),
      });

    // ── 2. Issue Trade Room SID immediately ──
    // The user may enter the Trade Room for a provisional $200 swap while
    // waiting for KYC approval. They need a SID NOW for Trade Room anonymity.
    let trade_mask_sid: string | null = session.user.tid ?? null;
    if (!trade_mask_sid) {
      try {
        const issuance = await issueTruequeIdForUser(ownerId, fields.country || 'XX');
        trade_mask_sid = issuance?.trueque_id ?? null;
        console.log('✅ SID issued at KYC submission:', { ownerId, trade_mask_sid });
      } catch (err) {
        // Non-fatal: SID issuance will be retried on /api/kyc/status check
        console.error('⚠️ SID issuance failed at submission (will retry):', err);
      }
    }

    // TODO: enqueueKycVerificationJob(submissionId) when verification provider is integrated

    return res.status(202).json({
      code: 'KYC_SUBMITTED',
      message: 'KYC submitted. Your Trade Room identity has been issued.',
      submission_id: submissionId,
      trade_mask_sid,
    });
  } catch (err) {
    console.error('KYC submit error', err);
    return res.status(500).json({ code: 'SERVER_ERROR', message: 'Unable to accept KYC submission' });
  }
}

export default withAuth(handler);
