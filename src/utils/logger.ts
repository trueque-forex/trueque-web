export const logEvent = (name: string, payload?: Record<string, any>) => {
  // lightweight client-side logger
  if (typeof window !== 'undefined') {
    console.debug(`[logEvent] ${name}`, payload ?? {});
  }
};
