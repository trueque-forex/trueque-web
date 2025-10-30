<<<<<<< HEAD
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
=======
import React from 'react';
import { acknowledgeFallback } from '@/utils/api';
import { logEvent } from '@/utils/logger';

type FallbackTriggerProps = {
  userId: string;
  corridor?: string;
  onSuccess?: (res: unknown) => void;
  onError?: (err: Error) => void;
};

const FallbackTrigger: React.FC<FallbackTriggerProps> = ({
  userId,
  corridor,
  onSuccess,
  onError,
}) => {
  const handleFallback = async () => {
    try {
      const res = await acknowledgeFallback('Missing corridor config', userId, corridor);
      logEvent('Fallback acknowledged', { corridor, userId, result: res });
      onSuccess?.(res);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      logEvent('Fallback acknowledgment failed', { corridor, userId, error: error.message });
      onError?.(error);
    }
  };

  return (
    <button type="button" onClick={handleFallback}>
      Trigger Fallback
    </button>
  );
};

export default FallbackTrigger;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
