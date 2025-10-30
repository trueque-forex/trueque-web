import fs from 'fs';
import path from 'path';
import { AuditPreview } from '../schemas/AuditPreviewSchema';

const logDir = path.join(__dirname, '../../logs');
const logFile = path.join(logDir, 'audit-preview.log');

export function persistAuditPreview(payload: AuditPreview): void {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const entry = {
    timestamp: payload.timestamp,
    corridor: payload.corridor,
    sender: payload.senderIntent.name,
    receiver: payload.receiverIntent.name,
    method: payload.receiverIntent.method,
    compliance: payload.compliance,
  };

  fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
}	
