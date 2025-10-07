import { logWithLocation } from '../modules/logger';

export const fetchAuditLogs = async (corridor: string, userId: string, location: string = 'Redlands, CA') => {
  try {
    // Your existing logic to fetch logs
    const logs = await getLogsByCorridor(corridor);

    logWithLocation('info', 'Audit fetch triggered', {
      corridor,
      userId,
      logCount: logs.length,
    }, location);

    return logs;
  } catch (error) {
    logWithLocation('error', 'Audit fetch failed', {
      corridor,
      userId,
      error: error.message,
    }, location);
    throw error;
  }
};