<<<<<<< HEAD
// src/lib/apiFetch.ts
export type ApiError = {
  status?: number;
  message: string;
  details?: any;
};

export default async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {},
  opts?: {
    baseUrl?: string;
    timeoutMs?: number;
    credentials?: RequestCredentials; // override default
  }
): Promise<{ res: Response; json: T | null }> {
  const controller = new AbortController();
  const timeout = opts?.timeoutMs;
  if (timeout) {
    setTimeout(() => controller.abort(), timeout);
  }

  const finalUrl = opts?.baseUrl ? new URL(url, opts.baseUrl).toString() : url;

  let response: Response;
  try {
    response = await fetch(finalUrl, {
      ...options,
      credentials: opts?.credentials ?? 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const e: ApiError = { message: 'Request timed out' };
      throw Object.assign(new Error(e.message), { apiError: e });
    }
    const e: ApiError = { message: err?.message || 'Network request failed' };
    throw Object.assign(new Error(e.message), { apiError: e });
  }

  // Safe JSON parse: return null for empty bodies or non-JSON
  let body: any = null;
  try {
    const text = await response.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const apiErr: ApiError = {
      status: response.status,
      message: body?.message || `Request failed: ${response.status}`,
      details: body?.details ?? body,
    };
    const err = new Error(apiErr.message);
    throw Object.assign(err, { apiError: apiErr });
  }

  return { res: response, json: body as T };
=======
// File: src/lib/apiFetch.ts
// Lightweight fetch wrapper that returns parsed JSON on success and throws a rich Error on failure.

export type ApiFetchResult<T = unknown> = {
  ok: boolean;
  status: number;
  json: T | null;
};

export default async function apiFetch<T = unknown>(
  input: RequestInfo,
  init?: RequestInit,
  opts?: { timeoutMs?: number }
): Promise<ApiFetchResult<T>> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
  if (opts?.timeoutMs && controller) {
    setTimeout(() => controller.abort(), opts.timeoutMs);
  }

  const requestInit: RequestInit = {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    signal: controller?.signal,
    ...init,
  };

  const res = await fetch(input, requestInit);

  // read raw text and attempt to parse JSON
  const text = await res.text().catch(() => '');
  let parsedBody: any = null;
  try {
    parsedBody = text ? JSON.parse(text) : null;
  } catch {
    parsedBody = text;
  }

  if (res.ok) {
    return { ok: true, status: res.status, json: parsedBody as T };
  }

  // Build a rich apiError object with status, headers and body for downstream inspection
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

  const apiErr = {
    status: res.status,
    statusText: res.statusText,
    body: parsedBody,
    headers: headersObj,
  };

  const message =
    apiErr.body?.message ??
    apiErr.body?.error ??
    `Request failed: ${apiErr.status} ${apiErr.statusText}`;

  const err = new Error(message);
  Object.assign(err, { apiError: apiErr });

  try {
    // eslint-disable-next-line no-console
    console.error('apiFetch throwing', JSON.stringify(apiErr, null, 2));
  } catch {}

  throw err;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
}