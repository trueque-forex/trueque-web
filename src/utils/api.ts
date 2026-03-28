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
  id: string
): Promise<FetchAuditLogsResponse> => {
  const res = await fetch(`${BASE_URL}/audit?corridor=${encodeURIComponent(corridor)}`, {
    method: 'GET',
    headers: {
      'x-user-id': id,
      'x-user-location': DEFAULT_LOCATION,
    },
  });
  if (!res.ok) throw new Error('Audit fetch failed');
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
};

export const acknowledgeFallback = async (
  reason: string,
  id: string,
  corridor?: string
): Promise<AcknowledgeFallbackResponse> => {
  const res = await fetch(`${BASE_URL}/fallback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': id,
      'x-user-location': DEFAULT_LOCATION,
    },
    body: JSON.stringify({ reason, corridor } as AcknowledgeFallbackRequest),
  });
  if (!res.ok) throw new Error('Fallback acknowledgment failed');
  const data = await res.json();
  return data as AcknowledgeFallbackResponse;
};
