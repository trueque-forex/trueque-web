import express from 'express';
import { acknowledgeFallback } from '../services/fallbackService';

const router = express.Router();

router.post('/', async (req, res) => {
  const { reason, corridor } = req.body;
  const userId = req.headers['x-user-id'] as string || 'anonymous';
  const location = req.headers['x-user-location'] as string || 'Redlands, CA';

  try {
    const result = await acknowledgeFallback(reason, userId, corridor, location);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Fallback acknowledgment failed', details: error.message });
  }
});

<<<<<<< HEAD
export default router;
=======
export default router;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
