import { describe, it, expect } from 'vitest';
import { validateRateIntegrity } from './rate-integrity';

describe('Rate Integrity Model (TS)', () => {
  it('returns true for valid rate structure', () => {
    const rate = { corridor: 'MX-US', baseRate: 20.5, fee: 1.5, total: 22.0 };
    expect(validateRateIntegrity(rate)).toBe(true);
  });

  it('returns false for mismatched total', () => {
    const rate = { corridor: 'MX-US', baseRate: 20.5, fee: 1.5, total: 21.0 };
    expect(validateRateIntegrity(rate)).toBe(false);
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
