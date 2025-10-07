import { acknowledgeFallback } from '../utils/api';
import { logEvent } from '../utils/logger';

const FallbackTrigger = ({ userId, corridor }: { userId: string; corridor?: string }) => {
  const handleFallback = () => {
    acknowledgeFallback('Missing corridor config', userId, corridor)
      .then(() => {
        logEvent('Fallback acknowledged', { corridor });
      })
      .catch((err) => {
        logEvent('Fallback acknowledgment failed', { corridor, error: err.message });
      });
  };

  return <button onClick={handleFallback}>Trigger Fallback</button>;
};

export default FallbackTrigger;