// debug\trueque-runtime-check.js
// Usage: node debug\trueque-runtime-check.js

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });

const path = require('path');
const modPath = path.resolve(__dirname, '..', 'src', 'lib', 'truequeId.ts');

const { generateTruequeId, validateTruequeId } = require(modPath);

const date = new Date(Date.UTC(2025, 10, 5));
const id = generateTruequeId(date, 'US', 42);
const payload = id.slice(0, -1).toUpperCase();
const checksumChar = id.slice(-1);

console.log({ id, payload, checksumChar, valid: validateTruequeId(id) });