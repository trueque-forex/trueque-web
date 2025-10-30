import { useEffect } from 'react';
import { fetchAuditLogs } from '../utils/api';
import { logEvent } from '../utils/logger';

const AuditPreview = ({ corridor, userId }: { corridor: string; userId: string }) => {
  useEffect(() => {
    fetchAuditLogs(corridor, userId)
      .then(({ logs }) => {
        logEvent('Audit preview rendered', { corridor, logCount: logs.length });
        // render logs...
      })
      .catch((err) => {
        logEvent('Audit preview error', { corridor, error: err.message });
      });
  }, [corridor, userId]);

  return <div>{/* Render audit logs here */}</div>;
};

export default AuditPreview;