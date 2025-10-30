import fetch from 'node-fetch';
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000'; // adjust if needed
const TEST_EMAIL = 'juan.perez@trueque.dev';
const TEST_PASSWORD = 'SecureTrial123';

async function cleanupUser(email: string) {
  const url = `${BASE_URL}/api/dev/users?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { method: 'DELETE' });
  const json = await res.json();
  console.log(`🧹 Cleanup response [${res.status}]:`, json);
}

import type { Response } from 'node-fetch';
async function runSignup(force = true): Promise<Response> {
  const url = `${BASE_URL}/api/auth/signup${force ? '?force=true' : ''}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  const json = await res.json();
  console.log(`🆕 Signup response [${res.status}]:`, json);
  return res;
}

async function submitKyc() {
  const form = new FormData();
  form.append('fullName', 'Juan Perez');
  form.append('dob', '1990-01-01');
  form.append('country', 'US');

  // Simulate empty file blobs for testing
  form.append('idFile', Buffer.from('fake-id'), { filename: 'id.pdf', contentType: 'application/pdf' });
  form.append('selfieFile', Buffer.from('fake-selfie'), { filename: 'selfie.jpg', contentType: 'image/jpeg' });
  form.append('addressFile', Buffer.from('fake-address'), { filename: 'address.pdf', contentType: 'application/pdf' });

  const res = await fetch(`${BASE_URL}/api/kyc/submit`, {
    method: 'POST',
    headers: form.getHeaders(),
    body: form,
  });

  const json = await res.json();
  console.log(`📤 KYC submission response [${res.status}]:`, json);
}

async function main() {
  await cleanupUser(TEST_EMAIL);
  const signupRes = await runSignup(true);

  if (signupRes.ok) {
    await submitKyc();
  } else {
    console.log('⚠️ Skipping KYC due to signup failure');
  }
}

main();
