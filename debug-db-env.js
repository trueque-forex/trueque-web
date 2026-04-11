const raw = process.env.DATABASE_URL;
const pgpw = process.env.PGPASSWORD;

function mask(v) {
  if (v == null) return '[empty]';
  try {
    const s = String(v);
    return s.length <= 12 ? s : s.slice(0, 6) + '...' + s.slice(-4);
  } catch {
    return '[not-string]';
  }
}

console.log('DATABASE_URL typeof:', typeof raw, 'masked:', mask(raw));
console.log('PGPASSWORD typeof:', typeof pgpw, 'masked:', mask(pgpw));