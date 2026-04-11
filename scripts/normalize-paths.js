// scripts/normalize-paths.js
const path = require('path');
const fs = require('fs');

// Always return forward-slash paths from these APIs
const origResolve = path.resolve;
path.resolve = function(...args) { return origResolve.apply(this, args).replace(/\\/g, '/'); };

const origRealpathSync = fs.realpathSync;
fs.realpathSync = function(...args) { return origRealpathSync.apply(this, args).replace(/\\/g, '/'); };

const origCwd = process.cwd;
process.cwd = function() { return origCwd.call(process).replace(/\\/g, '/'); };