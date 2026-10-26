#!/usr/bin/env node
'use strict';
/* Offline packager. Inspired by EquationWright's pinned MathJax 3.2.2 SVG
 * distribution, but built from npm's separately licensed MathJax package.
 */
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const vendor = path.join(root, 'offline', 'vendor');
fs.mkdirSync(vendor, { recursive: true });

function requireFile(pathname, description) {
  if (!fs.existsSync(pathname)) {
    throw Error('Missing ' + description + ': ' + pathname + '. Run npm install first.');
  }
  return pathname;
}
function copyLicense(packageName, outputFile) {
  const pkgDir = path.join(root, 'node_modules', packageName);
  const options = ['LICENSE.md', 'LICENSE', 'LICENSE.txt', 'license'];
  const source = options.map(name => path.join(pkgDir, name)).find(fs.existsSync);
  if (!source) throw Error('Missing license for ' + packageName + '; refusing redistribution.');
  fs.copyFileSync(source, path.join(vendor, outputFile));
}

const nerdamerJS = requireFile(
  path.join(root, 'node_modules', 'nerdamer', 'dist', 'bundle.js'),
  'Nerdamer browser bundle'
);
const mathjaxJS = requireFile(
  path.join(root, 'node_modules', 'mathjax', 'es5', 'tex-svg.js'),
  'MathJax 3.2.2 TeX-SVG bundle'
);
fs.copyFileSync(nerdamerJS, path.join(vendor, 'nerdamer.bundle.js'));
fs.copyFileSync(mathjaxJS, path.join(vendor, 'mathjax-tex-svg.js'));
copyLicense('nerdamer', 'NERDAMER-LICENSE.txt');
copyLicense('mathjax', 'MATHJAX-LICENSE.txt');
copyLicense('@cortex-js/compute-engine', 'CORTEXJS-LICENSE.txt');

// Pin the rule-tracing engine and bundle it for offline use, including file://.
esbuild.buildSync({
  entryPoints: [path.join(root, 'lib', 'step-engine.mjs')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2022',
  minify: true,
  outfile: path.join(vendor, 'step-engine.bundle.js'),
  logLevel: 'info'
});
fs.copyFileSync(path.join(root, 'lib', 'cas-adapter.js'), path.join(root, 'offline', 'cas-adapter.js'));

// Keep the original stand-alone tutor as the source of truth. Its bundled copy
// is enhanced by the *local* MathJax/nerdamer scripts, with no remote requests.
const tutor = requireFile(path.resolve(root, '..', 'index.html'), 'original offline tutor');
const original = fs.readFileSync(tutor, 'utf8');
const scripts = [
  '<script src="./mathjax-config.js"></script>',
  '<script defer src="./vendor/mathjax-tex-svg.js"></script>',
  '<script defer src="./vendor/nerdamer.bundle.js"></script>',
  '<script defer src="./lesson-math.js"></script>'
].join('\n');
if (!original.includes('</body>')) throw Error('Tutor HTML missing closing body tag.');
const enhanced = original.replace('</body>', scripts + '\n</body>');
fs.writeFileSync(path.join(root, 'offline', 'learn.html'), enhanced, 'utf8');

console.log('Offline-ready directory:', path.join(root, 'offline'));
console.log('Keep the whole offline/ folder together; step tracing also works without a CDN.');

require('./build-single-file.cjs');
