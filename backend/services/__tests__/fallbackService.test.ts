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
});