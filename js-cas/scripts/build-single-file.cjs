#!/usr/bin/env node
'use strict';
/* EquationWright-style single-file build:
 * embed both pinned libraries, MathJax configuration and application source.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'offline');
let html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
const scripts = [
  ['./mathjax-config.js', 'mathjax-config.js'],
  ['./vendor/mathjax-tex-svg.js', 'vendor/mathjax-tex-svg.js'],
  ['./vendor/nerdamer.bundle.js', 'vendor/nerdamer.bundle.js'],
  ['./cas-adapter.js', 'cas-adapter.js'],
  ['./vendor/step-engine.bundle.js', 'vendor/step-engine.bundle.js'],
  ['./app.js', 'app.js']
];
function safeForScript(value) {
  return value.replace(/<\/script/gi, '<\\/script');
}
function encodeText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}
const inline = [];
for (const [src, local] of scripts) {
  const normal = '<script src="' + src + '"></script>';
  const deferred = '<script defer src="' + src + '"></script>';
  const tag = html.includes(deferred) ? deferred : normal;
  if (!html.includes(tag)) throw Error('Missing expected script tag: ' + src);
  html = html.replace(tag, '');
  const data = fs.readFileSync(path.join(directory, local), 'utf8');
  inline.push('<script>\n/* Embedded offline asset: ' + local + ' */\n' +
    safeForScript(data) + '\n</script>');
}
const licenses = [
  ['mathjax', 'MATHJAX-LICENSE.txt'],
  ['nerdamer', 'NERDAMER-LICENSE.txt'],
  ['cortexjs', 'CORTEXJS-LICENSE.txt']
].map(([id, file]) => {
  const content = fs.readFileSync(path.join(directory, 'vendor', file), 'utf8');
  return '<template id="license-' + id + '">' + encodeText(content) + '</template>';
});
html = html.replace(
  '<a href="./learn.html">step-by-step learning tutor</a>',
  'step-by-step learning tutor (available in the complete offline package)'
);
html = html.replace(
  '</body>',
  '<!-- Third-party Apache-2.0 licenses preserved in readable templates. -->\n' +
    licenses.join('\n') + '\n' + inline.join('\n') + '\n</body>'
);
if (/<script\b[^>]*\bsrc\s*=/i.test(html)) throw Error('Single-file output still contains external script dependencies.');
if (!html.includes('</body>')) throw Error('Incomplete single-file output.');
const outputPath = path.join(directory, 'calculus-lab-single-file.html');
fs.writeFileSync(outputPath, html);
console.log('Wrote self-contained offline HTML:', outputPath, fs.statSync(outputPath).size, 'bytes');
