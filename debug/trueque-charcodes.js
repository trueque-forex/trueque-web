// debug/trueque-charcodes.js
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
const path = require('path');
const modPath = path.resolve(__dirname, '..', 'src', 'lib', 'truequeId.ts');
const { generateTruequeId } = require(modPath);

const date = new Date(Date.UTC(2025, 10, 5));
const id = generateTruequeId(date, 'US', 42);
console.log('id:', id);
console.log('chars:', Array.from(id).map((c, i) => `${i}:${c}(${c.charCodeAt(0)})`).join(' | '));