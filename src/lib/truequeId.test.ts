import { generateTruequeId, parseTruequeId, validateTruequeId } from './truequeId';

test('generate and validate TruequeId happy path', () => {
  const date = new Date(Date.UTC(2025, 10, 5)); // 2025-11-05 UTC
  const id = generateTruequeId(date, 'US', 42);
  expect(typeof id).toBe('string');
  expect(id.startsWith('T20251105US0042')).toBe(true);
  expect(validateTruequeId(id)).toBe(true);
  const parts = parseTruequeId(id);
  expect(parts).not.toBeNull();
  expect(parts?.countryCode).toBe('US');
  expect(parts?.seq).toBe(42);
});

test('invalid checksum is rejected', () => {
  const bad = 'T20251105US0042Z';
  expect(validateTruequeId(bad)).toBe(false);
  expect(parseTruequeId(bad)).not.toBeNull();
});

test('malformed ids parse as null', () => {
  expect(parseTruequeId('')).toBeNull();
  expect(parseTruequeId('T20251105U0042A')).toBeNull();
  expect(parseTruequeId('NOTANID')).toBeNull();
});

test('invalid checksum is rejected', () => {
  const bad = 'T20251105US0042Z'; // forced wrong checksum
  expect(validateTruequeId(bad)).toBe(false);
  expect(parseTruequeId(bad)).not.toBeNull(); // parse still works but validate fails
});

test('malformed ids parse as null', () => {
  expect(parseTruequeId('')).toBeNull();
  expect(parseTruequeId('T20251105U0042A')).toBeNull();
  expect(parseTruequeId('NOTANID')).toBeNull();
});