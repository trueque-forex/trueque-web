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
}