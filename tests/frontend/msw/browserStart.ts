// tests/frontend/msw/browserStart.ts
let _startPromise: Promise<void> | null = null;

export function startMswOnce(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (_startPromise) return _startPromise;

  _startPromise = (async () => {
    if ((window as any).__MSW_WORKER_STARTED__) return;
    console.log('[MSW-START] about to import msw/browser');
    try {
      const msw = await import('msw/browser').catch(() => undefined);
      if (!msw || typeof msw.setupWorker !== 'function') {
        console.warn('[MSW-START] setupWorker not available; skipping');
        return;
      }
      console.log('[MSW-START] imported msw/browser OK');

      const handlersModule: any = await import('./handlers').catch((e) => {
        console.error('[MSW-START] failed to import handlers', e);
        return undefined;
      });
      if (!handlersModule) return;

      const factory =
        handlersModule.getHandlers ??
        handlersModule.default ??
        handlersModule;
      if (typeof factory !== 'function') {
        console.error('[MSW-START] handlers factory not a function', Object.keys(handlersModule));
        return;
      }

      const handlers = await factory();
      if (!Array.isArray(handlers)) {
        console.error('[MSW-START] handlers not an array', handlers);
        return;
      }

      const { setupWorker } = msw;
      const worker = setupWorker(...handlers);
      await worker.start({ onUnhandledRequest: 'bypass' });
      (window as any).__MSW_WORKER_STARTED__ = true;
      console.log('[MSW-START] MSW worker started');
    } catch (e) {
      console.error('[MSW-START] unexpected error', e);
    }
  })();

  return _startPromise;
}

export function isMswReady(): boolean {
  return !!(typeof window !== 'undefined' && (window as any).__MSW_WORKER_STARTED__);
}