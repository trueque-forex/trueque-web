// frontend/msw/browser.ts
// Client-only MSW bootstrap. This file dynamically asks the handlers
// module for runtime handlers and starts the worker only in the browser.
// It avoids build-time imports of internal msw subpaths.

let workerInstance: any | null = null;

function safeLog(...args: any[]) {
  // eslint-disable-next-line no-console
  console.debug('[MSW-START]', ...args);
}

export async function start() {
  if (typeof window === 'undefined') return;
  if (workerInstance) return workerInstance;

  try {
    // Import the browser runtime if available, otherwise fallback to msw top-level.
    const mswEntry = await import('msw/browser').catch(() => undefined) ?? await import('msw').catch(() => undefined);
    const mswModule = (mswEntry && (mswEntry as any).default && Object.keys(mswEntry).length === 1) ? (mswEntry as any).default : mswEntry;

    safeLog('mswModule keys:', mswModule ? Object.keys(mswModule) : mswModule);

    if (!mswModule || typeof mswModule.setupWorker !== 'function') {
      // eslint-disable-next-line no-console
      console.error('[MSW-START] setupWorker not found on imported msw module', mswModule ? Object.keys(mswModule) : mswModule);
      (window as any).__MSW_READY__ = false;
      return;
    }

    const handlersModule = await import('./handlers').catch((e) => {
      // eslint-disable-next-line no-console
      console.error('[MSW-START] failed to import handlers module', e);
      return undefined as any;
    });

    const getHandlers = handlersModule?.getHandlers ?? handlersModule?.default ?? handlersModule?.createHandlers;

    if (typeof getHandlers !== 'function') {
      // eslint-disable-next-line no-console
      console.error('[MSW-START] handlers module does not export getHandlers()');
      (window as any).__MSW_READY__ = false;
      return;
    }

    const handlers = await getHandlers();

    if (!Array.isArray(handlers)) {
      // eslint-disable-next-line no-console
      console.error('[MSW-START] handlers factory did not return an array', handlers);
      (window as any).__MSW_READY__ = false;
      return;
    }

    workerInstance = mswModule.setupWorker(...handlers);

    await workerInstance.start({ onUnhandledRequest: 'bypass' });

    (window as any).__MSW_WORKER__ = workerInstance;
    (window as any).__MSW_SET_SCENARIO = (s: string) => {
      import('./handlers')
        .then((m) => {
          if (typeof m.setSignupScenario === 'function') m.setSignupScenario(s as any);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[MSW-START] set scenario import failed', err);
        });
    };

    (window as any).__MSW_READY__ = true;
    safeLog('MSW worker started');
    return workerInstance;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[MSW-START] unexpected error', err);
    (window as any).__MSW_READY__ = false;
    throw err;
  }
}

// Auto-start in dev browser only
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  start().catch(() => { });
}

export const worker = { start: () => start() };