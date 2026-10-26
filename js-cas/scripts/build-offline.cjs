#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const vendor = path.join(root, 'offline', 'vendor');
fs.mkdirSync(vendor, {recursive:true});
const bundle = path.join(root, 'node_modules', 'nerdamer', 'dist', 'bundle.js');
if (!fs.existsSync(bundle)) throw Error('Missing Nerdamer browser build. Run npm install first.');
fs.copyFileSync(bundle, path.join(vendor, 'nerdamer.bundle.js'));
const pkgDir = path.join(root, 'node_modules', 'nerdamer');
const licenseCandidates = ['LICENSE.md', 'LICENSE', 'LICENSE.txt'];
const sourceLicense = licenseCandidates.map(name => path.join(pkgDir, name)).find(fs.existsSync);
if (!sourceLicense) throw Error('Missing Nerdamer license, refusing unlicensed redistribution.');
fs.copyFileSync(sourceLicense, path.join(vendor, 'NERDAMER-LICENSE.txt'));
fs.copyFileSync(path.join(root, 'lib', 'cas-adapter.js'), path.join(root, 'offline', 'cas-adapter.js'));
console.log('Offline-ready directory:', path.join(root, 'offline'));
console.log('Keep offline/index.html, app.js, cas-adapter.js, and vendor/ together.');
