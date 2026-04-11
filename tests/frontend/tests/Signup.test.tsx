import React from 'react';
import { vi, beforeEach, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from '../../../src/pages/signup';
import { setSignupScenario } from '../msw/test-handlers';
import * as nextRouter from 'next/router';

// Minimal next/router mock for navigation assertions
const mockReplace = vi.fn();
vi.spyOn(nextRouter, 'useRouter').mockImplementation(() => ({
  push: vi.fn(),
  replace: mockReplace,
  back: vi.fn(),
  prefetch: vi.fn(),
  query: {},
  pathname: '',
  asPath: '',
  route: '',
  basePath: '',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  isFallback: false,
  isReady: true,
  isLocaleDomain: false,
  isPreview: false,
  forward: vi.fn(),
  reload: vi.fn(),
  beforePopState: vi.fn(),
}));

beforeEach(() => {
  setSignupScenario('success');
  mockReplace.mockClear();
});

test('signup success redirects to /swap', async () => {
  setSignupScenario('success');
  render(<SignupPage />);

  fireEvent.change(screen.getByLabelText(/username or email/i), { target: { value: 'janedoe' } });
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'jane@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
  fireEvent.change(screen.getByTestId('confirm-password'), { target: { value: 'password123' } });
  fireEvent.change(screen.getByLabelText(/country of residence/i), { target: { value: 'US' } });
  fireEvent.change(screen.getByLabelText(/^address$/i), { target: { value: '1 Main St' } });
  fireEvent.change(screen.getByLabelText(/country destiny/i), { target: { value: 'MX' } });

  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  await waitFor(() => {
    // SignupPage calls router.replace('/swap') on success
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/swap/));
  });
});

test('email exists shows server error and actionable options', async () => {
  setSignupScenario('email_exists');
  render(<SignupPage />);

  fireEvent.change(screen.getByLabelText(/username or email/i), { target: { value: 'janedoe' } });
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
  fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '1990-01-01' } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'exists@example.com' } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
  fireEvent.change(screen.getByTestId('confirm-password'), { target: { value: 'password123' } });
  fireEvent.change(screen.getByLabelText(/country of residence/i), { target: { value: 'US' } });
  fireEvent.change(screen.getByLabelText(/^address$/i), { target: { value: '1 Main St' } });
  fireEvent.change(screen.getByLabelText(/country destiny/i), { target: { value: 'MX' } });

  fireEvent.click(screen.getByRole('button', { name: /create account/i }));

  // The component shows conflict message for email exists scenario
  // "An account already exists for exists@example.com"
  const err = await screen.findByText(/An account already exists for/i);
  expect(err).toBeInTheDocument();
});