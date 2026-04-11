import { readFileSync } from 'fs';
import crypto from 'crypto';
import path from 'path';

// load the built source file text to avoid executing test-time imports
const file = path.resolve('src/lib/truequeId.ts');
console.log('Inspecting file:', file);
console.log(readFileSync(file, 'utf8').split('\n').slice(0,40).join('\n'));