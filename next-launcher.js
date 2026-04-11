// next-launcher.js
// Auto-detects an exact-cased cwd string Next expects and launches `next dev`
// Usage: node next-launcher.js dev

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function resolveNextCli(root) {
  const candidates = [
    (() => { try { return require.resolve('next/dist/bin/next'); } catch (e) { return null; } })(),
    path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next.js'),
    path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function trailingVariants(s) {
  const out = [s];
  if (!s.endsWith(path.sep) && !s.endsWith('/')) out.push(s + path.sep);
  return out;
}

function makeCandidates() {
  const real = fs.realpathSync(process.cwd()); // canonical on-disk path
  const orig = process.cwd(); // process cwd as reported
  const drive = real.slice(0, 2); // "C:"
  const rest = real.slice(2); // "\Users\..."
  const restBack = rest.replace(/\//g, '\\');
  const restForward = rest.replace(/\\/g, '/');
  const normalizedForward = restForward.replace(/\/+/g, '/');

  // Title-case each segment (useful when case differs only in segment initials)
  const segsBack = restBack.split(/\\|\//).filter(Boolean);
  const titleCasedBack = segsBack.map(s => s ? s[0].toUpperCase() + s.slice(1) : s).join(path.sep);
  const titleCasedForward = titleCasedBack.replace(/\\/g, '/');

  // Drive permutations
  const driveLower = drive.toLowerCase();
  const driveUpper = drive.toUpperCase();

  const raw = [
    real,
    orig,
    `${drive}${restBack}`,
    `${drive}${restForward}`,
    `${drive}${normalizedForward}`,
    `${driveLower}${restBack.slice(2)}`,
    `${driveUpper}${restBack.slice(2)}`,
    `${drive}${titleCasedBack}`,
    `${drive}${titleCasedForward}`,
    `${driveLower}${titleCasedBack}`,
    `${driveUpper}${titleCasedBack}`,
    // Also try common normalized variants
    `${drive}${restBack.replace(/\\+/g, '\\')}`,
    `${drive}${restForward.replace(/\/+/g, '/')}`
  ].filter(Boolean);

  // Expand trailing variations and ensure uniqueness
  const expanded = raw.flatMap(s => trailingVariants(s));
  return Array.from(new Set(expanded));
}

function spawnNext(nextCli, cwd, args) {
  // preserve environment but ensure cwd is exactly as provided
  const result = cp.spawnSync(process.execPath, [nextCli, ...args], {
    stdio: 'inherit',
    cwd,
    env: process.env,
    windowsHide: false
  });
  return result;
}

(function main() {
  const realRoot = fs.realpathSync(process.cwd());
  const nextCliAbsolute = resolveNextCli(realRoot);

  if (!nextCliAbsolute) {
    console.error('next CLI not found. Tried require.resolve and node_modules paths.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args.length === 0) args.push('dev');

  const candidates = makeCandidates();

  console.log('realRoot:', realRoot);
  console.log('nextCliAbsolute:', nextCliAbsolute);
  console.log('Candidate cwds to try (in order):');
  candidates.forEach((c, i) => console.log(`${String(i + 1).padStart(2)}: ${c}`));
  console.log('');

  // Try each candidate. Stop on first successful start (exit code 0).
  for (const cwd of candidates) {
    try {
      console.log('-> trying cwd:', cwd);
      const res = spawnNext(nextCliAbsolute, cwd, args);
      if (res && typeof res.status === 'number') {
        if (res.status === 0) {
          console.log('Next exited successfully for cwd:', cwd);
          process.exit(0);
        } else {
          console.warn(`next exited with code ${res.status} for cwd ${cwd}`);
        }
      } else if (res && res.error) {
        console.warn(`next failed for cwd ${cwd}: ${res.error && res.error.message}`);
      } else {
        console.warn(`next spawn returned unexpected result for cwd ${cwd}`);
      }
    } catch (err) {
      console.warn(`error launching next with cwd ${cwd}:`, err && err.message ? err.message : err);
    }
    console.log(''); // spacer between attempts
  }

  console.error('All candidate cwds failed to start Next. Review candidates above and try adding any other likely textual variants manually.');
  process.exit(1);
})();