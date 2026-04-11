// tests/frontend/mocks/nextRouter.mock.ts
// Lightweight next/router mock for Jest + RTL tests.
// Usage in tests: jest.mock('next/router', () => require('../../tests/frontend/mocks/nextRouter.mock'));

const push = jest.fn(() => Promise.resolve(true));
const replace = jest.fn(() => Promise.resolve(true));
const back = jest.fn();
const prefetch = jest.fn(() => Promise.resolve());

export const __resetMocks = () => {
  push.mockClear();
  replace.mockClear();
  back.mockClear();
  prefetch.mockClear();
};

export default {
  useRouter: () => ({
    push,
    replace,
    back,
    prefetch,
    query: {},
    pathname: '/',
    asPath: '/',
  }),
  // Expose functions for tests to assert calls if they import the module directly
  __mock: { push, replace, back, prefetch, __resetMocks },
};