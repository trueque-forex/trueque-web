// debug\trueque-values.js
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
const path = require('path');
const mod = require(path.resolve(__dirname, '..', 'src', 'lib', 'truequeId.ts'));
const { generateTruequeId, validateTruequeId, computeChecksum } = mod;

const date = new Date(Date.UTC(2025, 10, 5));
const id = generateTruequeId(date, 'US', 42);
const payload = id.slice(0, -1);
const checksumChar = id.slice(-1);
const expected = typeof computeChecksum === 'function' ? computeChecksum(payload) : '<no-export>';

console.log({ id, payload, checksumChar, expected, valid: validateTruequeId(id) });