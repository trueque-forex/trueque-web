import '@testing-library/jest-dom';
import { server } from './frontend/msw/server';
import { setSignupScenario } from './frontend/msw/test-handlers';
import { beforeAll, afterEach, afterAll } from 'vitest';

// Start MSW server before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset handlers and scenario between tests.
afterEach(() => {
    server.resetHandlers();
    setSignupScenario('success');
});

// Close server after tests.
afterAll(() => server.close());
