// src/server/controllers/auditPreview.controller.ts
import type { Request, Response } from 'express';

type AuditPreview = {
  ok: true;
  preview: unknown;
  receivedAt: string;
};

/**
 * Minimal submitAuditPreview controller used by routes and tests.
 * Replace business logic with your real implementation as needed.
 */
export async function submitAuditPreview(req: Request, res: Response): Promise<void> {
  try {
    const payload: unknown = req.body ?? {};

    const preview: AuditPreview = {
      ok: true,
      preview: payload,
      receivedAt: new Date().toISOString(),
    };

    res.status(200).json(preview);
  } catch (err: any) {
    console.error('submitAuditPreview error', err);
    res.status(500).json({ error: err?.message ?? 'Internal error' });
  }
}