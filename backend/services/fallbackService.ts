import { logWithLocation } from '../modules/logger';


// backend/services/fallbackService.ts
type FallbackResult = { status: 'acknowledged' };

export async function acknowledgeFallback(
  reason: string,
  userId: string,
  corridor: string,
  location: string
): Promise<FallbackResult> {
  try {
    // If reason is missing, treat as an error to match test expectation
    if (!reason) {
      throw new Error('missing reason');
    }

    // Normal acknowledgement path (test-friendly logging)
    console.warn(JSON.stringify({ corridor, userId, location, message: 'Fallback acknowledged', reason }));
    return { status: 'acknowledged' };
  } catch (err: any) {
    // Log error in the shape tests expect and re-throw so tests can assert rejection
    console.error(JSON.stringify({ corridor, userId, location, error: err?.message ?? String(err), message: 'Fallback acknowledge failed' }));
    throw err;
  }
}
