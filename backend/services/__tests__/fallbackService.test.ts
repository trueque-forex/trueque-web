<<<<<<< HEAD
=======
import { describe, it, expect } from 'vitest';
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
import { acknowledgeFallback } from '../fallbackService';

describe('acknowledgeFallback', () => {
  const reason = 'Missing corridor config';
  const userId = 'user123';
  const corridor = 'MX-USD';
  const location = 'Redlands, CA';

  it('acknowledges fallback successfully', async () => {
    const result = await acknowledgeFallback(reason, userId, corridor, location);
    expect(result.status).toBe('acknowledged');
  });

  it('logs error on failure', async () => {
    await expect(acknowledgeFallback('', userId, corridor, location)).rejects.toThrow();
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
