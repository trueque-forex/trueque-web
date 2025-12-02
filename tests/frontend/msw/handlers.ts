// tests/frontend/msw/handlers.ts
// Runtime-safe MSW handlers factory.
// This file dynamically imports the browser MSW runtime at runtime
// and returns an array of handlers. If `rest` isn't available it
// returns an empty array to avoid build-time package-subpath imports.

export type SignupScenario =
  | 'success'
  | 'success_with_corridor'
  | 'email_exists'
  | 'validation_error'
  | 'kyc_required'
  | 'server_error'
  | 'network_error';

let currentScenario: SignupScenario = 'success';

export const setSignupScenario = (s: SignupScenario) => {
  currentScenario = s;
};

function getHeader(req: any, name: string): string | undefined {
  try {
    if (req?.headers && typeof req.headers.get === 'function') {
      return req.headers.get(name) ?? undefined;
    }
    if (req?.headers && typeof req.headers === 'object') {
      return req.headers[name] ?? req.headers[name.toLowerCase()] ?? undefined;
    }
  } catch {
    // ignore
  }
  return undefined;
}

async function readBody(req: any): Promise<any> {
  try {
    if (req && typeof req.json === 'function') {
      return await req.json().catch(() => undefined);
    }
    if (req && typeof req.text === 'function') {
      return await req.text().catch(() => undefined);
    }
    if (req && typeof req.arrayBuffer === 'function') {
      const buf = await req.arrayBuffer().catch(() => undefined);
      if (buf) {
        try {
          return new TextDecoder().decode(buf);
        } catch {
          return buf;
        }
      }
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Returns an array of handlers at runtime.
 * Avoids build-time imports of msw internal paths.
 */
export async function getHandlers(): Promise<any[]> {
  // Early guard: server-side evaluation returns empty handlers immediately.
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    // Prefer explicit browser entry; fall back to top-level msw if needed.
    let mswModule: any = await import('msw/browser').catch(() => undefined);
    if (!mswModule) {
      mswModule = await import('msw').catch(() => undefined);
    }

    // Normalize default interop if necessary.
    if (mswModule && mswModule.default && Object.keys(mswModule).length === 1) {
      mswModule = mswModule.default;
    }

    const rest = mswModule?.rest;
    if (!rest || typeof rest.post !== 'function') {
      // Rest not available in this environment — return empty handlers (no-op).
      // eslint-disable-next-line no-console
      console.warn('[MSW-HANDLERS] msw.rest not available; returning empty handlers');
      return [];
    }

    const signupPaths = ['/api/auth/signup', '/auth/signup'];

    const signupHandler = rest.post(signupPaths, async (req: any, res: any, ctx: any) => {
      const host = getHeader(req, 'host');
      const body = await readBody(req);

      switch (currentScenario) {
        case 'success':
          return res(ctx.status(200), ctx.json({ redirectCorridor: undefined, message: 'account_created' }));
        case 'success_with_corridor':
          return res(
            ctx.status(200),
            ctx.json({ redirectCorridor: 'corridor_XYZ', message: 'account_created' })
          );
        case 'email_exists':
          return res(
            ctx.status(400),
            ctx.json({ error: 'email_exists', code: 'EMAIL_EXISTS', message: 'Email already registered' })
          );
        case 'validation_error':
          return res(
            ctx.status(422),
            ctx.json({
              error: 'validation_failed',
              message: 'Invalid input',
              details: { email: 'Invalid email', password: 'Too short' },
            })
          );
        case 'kyc_required':
          return res(ctx.status(200), ctx.json({ needsKyc: true, kycStatus: 'pending' }));
        case 'server_error':
          return res(ctx.status(500), ctx.json({ error: 'internal', message: 'Internal server error' }));
        case 'network_error':
          return res.networkError('Failed to connect');
        default:
          return res(ctx.status(500), ctx.json({ error: 'unhandled_scenario', host, body }));
      }
    });

    return [signupHandler];
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[MSW-HANDLERS] failed to build handlers', err);
    return [];
  }
}

export default getHandlers;
