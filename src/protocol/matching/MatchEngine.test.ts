import { describe, it, expect } from 'vitest';
import { match } from './MatchEngine';

describe('MatchEngine', () => {
  it('matches senders to recipients', () => {
    const result = match();
    expect(result).toBeDefined();
    expect(result.sender.id).toBe('A');
    expect(result.receiver.id).toBe('B');
  });
});
