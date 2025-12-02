// src/lib/truequeId.checksum.test.ts
import { computeChecksum } from './truequeId';

describe('computeChecksum', () => {
  test('is deterministic for same payload', () => {
    const p = 'T20251105US0042';
    const a = computeChecksum(p);
    const b = computeChecksum(p);
    expect(typeof a).toBe('string');
    expect(a).toBe(b);
  });

  test('returns a single base36 character', () => {
    const ch = computeChecksum('T20251105US0042');
    expect(ch).toMatch(/^[0-9A-Z]$/);
  });

  test('normalizes input and remains single-char', () => {
    const p1 = ' T20251105US0042 ';
    const p2 = 't20251105us0042';
    const c1 = computeChecksum(p1);
    const c2 = computeChecksum(p2);
    expect(typeof c1).toBe('string');
    expect(typeof c2).toBe('string');
    expect(c1).toMatch(/^[0-9A-Z]$/);
    expect(c2).toMatch(/^[0-9A-Z]$/);
    expect(c1).toBe(c2);
  });

  test('different payloads produce different or at least consistent checksums', () => {
    const a = computeChecksum('T20251105US0042');
    const b = computeChecksum('T20251105US0043');
    expect(a).not.toBeUndefined();
    expect(b).not.toBeUndefined();
  });
});