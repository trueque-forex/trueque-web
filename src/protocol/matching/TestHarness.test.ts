<<<<<<< HEAD
=======
// src/protocol/matching/TestHarness.test.ts
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
import { describe, it, expect } from 'vitest';
import { match, matchSenders } from './TestHarness';

describe('TestHarness', () => {
  it('calls match()', () => {
    const result = match();
    expect(result).toBeDefined();
    expect(result.sender.id).toBe('A');
    expect(result.receiver.id).toBe('B');
  });

  it('calls matchSenders()', () => {
    const sender = { id: 'X', country: 'MX', amount: 50 };
    const receiver = { id: 'Y', country: 'US', amount: 50 };
    const result = matchSenders(sender, receiver);
    expect(result.sender.id).toBe('X');
    expect(result.receiver.id).toBe('Y');
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
