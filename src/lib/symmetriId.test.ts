import { generateSymmetriId, parseTradeMaskSid, validateTradeMaskSid } from './symmetriId';

test('generate and validate TruequeId happy path', () => {
  const date = new Date(Date.UTC(2025, 10, 5)); // 2025-11-05 UTC
  const id = generateSymmetriId(date, 'US', 42);
  expect(typeof id).toBe('string');
  expect(id.startsWith('T20251105US0042')).toBe(true);
  expect(validateTradeMaskSid(id)).toBe(true);
  const parts = parseTradeMaskSid(id);
  expect(parts).not.toBeNull();
  expect(parts?.countryCode).toBe('US');
  expect(parts?.seq).toBe(42);
});

test('invalid checksum is rejected', () => {
  const bad = 'T20251105US0042Z';
  expect(validateTradeMaskSid(bad)).toBe(false);
  expect(parseTradeMaskSid(bad)).not.toBeNull();
});

test('malformed ids parse as null', () => {
  expect(parseTradeMaskSid('')).toBeNull();
  expect(parseTradeMaskSid('T20251105U0042A')).toBeNull();
  expect(parseTradeMaskSid('NOTANID')).toBeNull();
});

test('invalid checksum is rejected', () => {
  const bad = 'T20251105US0042Z'; // forced wrong checksum
  expect(validateTradeMaskSid(bad)).toBe(false);
  expect(parseTradeMaskSid(bad)).not.toBeNull(); // parse still works but validate fails
});

test('malformed ids parse as null', () => {
  expect(parseTradeMaskSid('')).toBeNull();
  expect(parseTradeMaskSid('T20251105U0042A')).toBeNull();
  expect(parseTradeMaskSid('NOTANID')).toBeNull();
});