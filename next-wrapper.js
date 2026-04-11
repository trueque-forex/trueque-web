// next-wrapper.js
// Loads scripts/normalize-paths.js before launching Next CLI
const path = require('path');
const cp = require('child_process');

// load your normalizer early
require('./scripts/normalize-paths');

const nextCli = (() => {
  try { return require.resolve('next/dist/bin/next'); } catch (e) {
    return path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  }
})();

const args = process.argv.slice(2);
if (args.length === 0) args.push('dev');

const res = cp.spawnSync(process.execPath, [nextCli, ...args], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: Object.assign({}, process.env)
});
process.exit(res.status || (res.error ? 1 : 0));