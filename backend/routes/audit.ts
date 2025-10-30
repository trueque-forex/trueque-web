import express from 'express';
import { fetchAuditLogs } from '../services/auditService';

const router = express.Router();

router.get('/', async (req, res) => {
  const corridor = req.query.corridor as string;
  const userId = req.headers['x-user-id'] as string || 'anonymous';
  const location = req.headers['x-user-location'] as string || 'Redlands, CA';

  try {
    const logs = await fetchAuditLogs(corridor, userId, location);
    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Audit fetch failed', details: error.message });
  }
});

<<<<<<< HEAD
export default router;
=======
export default router;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
