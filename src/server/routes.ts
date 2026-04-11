// src/server/routes.ts
import express from 'express';
import { submitAuditPreview } from './controllers/auditPreview.controller';

const router = express.Router();

// register routes
router.post('/audit-preview', submitAuditPreview);

export default router;
