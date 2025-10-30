<<<<<<< HEAD
const BASE_URL = '/api';
const DEFAULT_LOCATION = 'Redlands, CA';

export const fetchAuditLogs = async (corridor: string, userId: string) => {
=======
// src/utils/api.ts

const BASE_URL = '/api';
const DEFAULT_LOCATION = 'Redlands, CA';

type AuditLog = {
  id: string;
  userId?: string;
  action: string;
  timestamp: string;
  details?: Record<string, unknown>;
};

type FetchAuditLogsResponse = {
  logs: AuditLog[];
  total: number;
};

export const fetchAuditLogs = async (
  corridor: string,
  userId: string
): Promise<FetchAuditLogsResponse> => {
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  const res = await fetch(`${BASE_URL}/audit?corridor=${encodeURIComponent(corridor)}`, {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-location': DEFAULT_LOCATION,
    },
  });
  if (!res.ok) throw new Error('Audit fetch failed');
<<<<<<< HEAD
  return res.json();
=======
  const data = await res.json();
  return data as FetchAuditLogsResponse;
};

type AcknowledgeFallbackRequest = {
  reason: string;
  corridor?: string;
};

type AcknowledgeFallbackResponse = {
  ok: boolean;
  id?: string;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
};

export const acknowledgeFallback = async (
  reason: string,
  userId: string,
  corridor?: string
<<<<<<< HEAD
) => {
=======
): Promise<AcknowledgeFallbackResponse> => {
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  const res = await fetch(`${BASE_URL}/fallback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-location': DEFAULT_LOCATION,
    },
<<<<<<< HEAD
    body: JSON.stringify({ reason, corridor }),
  });
  if (!res.ok) throw new Error('Fallback acknowledgment failed');
  return res.json();
=======
    body: JSON.stringify({ reason, corridor } as AcknowledgeFallbackRequest),
  });
  if (!res.ok) throw new Error('Fallback acknowledgment failed');
  const data = await res.json();
  return data as AcknowledgeFallbackResponse;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
};
