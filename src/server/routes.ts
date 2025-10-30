<<<<<<< HEAD
import { submitAuditPreview } from './controllers/auditPreview.controller';

router.post('/audit-preview', submitAuditPreview);
=======
// src/server/routes.ts
import express from 'express';
import { submitAuditPreview } from './controllers/auditPreview.controller';

const router = express.Router();

// register routes
router.post('/audit-preview', submitAuditPreview);

export default router;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
