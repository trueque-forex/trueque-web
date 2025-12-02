// src/lib/apiFetch.ts
// Robust fetch wrapper that returns { res, json } on success and throws an Error with `apiError` on failure.

export type ApiError = {
  status?: number;
  statusText?: string;
  message: string;
  body?: any;
  headers?: Record<string, string>;
  details?: any;
};

export default async function apiFetch<T = any>(
  input: RequestInfo,
  init: RequestInit = {},
  opts?: {
    baseUrl?: string;
    timeoutMs?: number;
    credentials?: RequestCredentials;
  }
): Promise<{ res: Response; json: T | null }> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  if (opts?.timeoutMs && controller) {
    setTimeout(() => controller.abort(), opts.timeoutMs);
  }

  const finalUrl = opts?.baseUrl ? new URL(String(input), opts.baseUrl).toString() : input;

  const requestInit: RequestInit = {
    credentials: opts?.credentials ?? 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    signal: controller?.signal,
    ...init,
  };

  let res: Response;
  try {
    res = await fetch(finalUrl as any, requestInit);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      const e: ApiError = { message: 'Request timed out' };
      throw Object.assign(new Error(e.message), { apiError: e });
    }
    const e: ApiError = { message: err?.message ?? 'Network request failed' };
    throw Object.assign(new Error(e.message), { apiError: e });
  }

  // read raw text and attempt to parse JSON
  let text = '';
  try {
    text = await res.text();
  } catch {
    text = '';
  }

  let parsedBody: any = null;
  try {
    parsedBody = text ? JSON.parse(text) : null;
  } catch {
    // keep raw text if not JSON
    parsedBody = text || null;
  }

  if (res.ok) {
    return { res, json: parsedBody as T };
  }

  // Build headers object safely
  const headersObj: Record<string, string> = {};
  try {
    if (res.headers && typeof (res.headers as any).forEach === 'function') {
      (res.headers as any).forEach((value: string, key: string) => {
        headersObj[key] = value;
      });
    } else if (res.headers && typeof (res.headers as any).entries === 'function') {
      for (const [k, v] of (res.headers as any).entries()) {
        headersObj[k] = v;
      }
    }
  } catch {
    // ignore header parsing errors
  }

  const apiErr: ApiError = {
    status: res.status,
    statusText: res.statusText,
    message:
      (parsedBody && (parsedBody.message || parsedBody.error)) ||
      `Request failed: ${res.status} ${res.statusText}`,
    body: parsedBody,
    headers: headersObj,
    details: parsedBody?.details ?? undefined,
  };

  const err = new Error(apiErr.message);
  Object.assign(err, { apiError: apiErr });

  try {
    // best-effort logging for local debugging
    // eslint-disable-next-line no-console
    console.error('apiFetch throwing', JSON.stringify(apiErr, null, 2));
  } catch {}

  throw err;
}