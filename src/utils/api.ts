const BASE_URL = '/api';
const DEFAULT_LOCATION = 'Redlands, CA';

export const fetchAuditLogs = async (corridor: string, userId: string) => {
  const res = await fetch(`${BASE_URL}/audit?corridor=${encodeURIComponent(corridor)}`, {
    method: 'GET',
    headers: {
      'x-user-id': userId,
      'x-user-location': DEFAULT_LOCATION,
    },
  });
  if (!res.ok) throw new Error('Audit fetch failed');
  return res.json();
};

export const acknowledgeFallback = async (
  reason: string,
  userId: string,
  corridor?: string
) => {
  const res = await fetch(`${BASE_URL}/fallback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-user-location': DEFAULT_LOCATION,
    },
    body: JSON.stringify({ reason, corridor }),
  });
  if (!res.ok) throw new Error('Fallback acknowledgment failed');
  return res.json();
};
