import { fetchAuditLogs } from '../auditService';

describe('fetchAuditLogs', () => {
  const corridor = 'MX-USD';
  const userId = 'user123';
  const location = 'Redlands, CA';

  it('returns mock logs with correct corridor', async () => {
    const logs = await fetchAuditLogs(corridor, userId, location);
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.every(log => log.corridor === corridor)).toBe(true);
  });

  it('logs error on failure', async () => {
    const badCorridor = '';
    await expect(fetchAuditLogs(badCorridor, userId, location)).rejects.toThrow();
  });
});