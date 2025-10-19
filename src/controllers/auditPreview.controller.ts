import { Request, Response } from 'express';
import { AuditPreview, validateAuditPreview } from '../schemas/AuditPreviewSchema';
import { persistAuditPreview } from '../services/auditLog.service';

export async function submitAuditPreview(req: Request, res: Response) {
  const payload: AuditPreview = req.body;

  try {
    const isValid = validateAuditPreview(payload);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid audit preview payload. Check corridor, method format, and compliance flags.',
      });
    }

    persistAuditPreview(payload);
    console.log('✅ Valid Audit Preview:', payload);

    return res.status(200).json({
      success: true,
      message: 'Audit preview accepted and validated.',
      timestamp: payload.timestamp,
    });
  } catch (error) {
    console.error('❌ Audit Preview Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during audit preview validation.',
    });
  }
}
