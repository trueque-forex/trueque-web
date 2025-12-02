// tests/jest/setupTests.ts
import '@testing-library/jest-dom';
import { server } from '../msw/server';
import { setSignupScenario } from '../msw/handlers';

// Start MSW server before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers and scenario between tests.
afterEach(() => {
  server.resetHandlers();
  setSignupScenario('success');
});

// Close server after tests.
afterAll(() => server.close());