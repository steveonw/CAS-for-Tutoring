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
  ['./vendor/mathlive.min.js', 'vendor/mathlive.min.js'],
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
  // The large CortexJS bundle contains HTML-parser-sensitive script text.
  // Transport its TRUSTED BUILD-TIME bytes as base64 to prevent the browser's
  // HTML parser from truncating the inline JavaScript. Never eval user input.
  if (local === 'vendor/step-engine.bundle.js' || local === 'vendor/mathlive.min.js') {
    const encoded = Buffer.from(data, 'utf8').toString('base64');
    inline.push('<script>\n/* Bundled offline derivative step engine (build-time trusted) */\n' +
      '(0,eval)(new TextDecoder().decode(Uint8Array.from(atob("' + encoded + '"), c => c.charCodeAt(0))));\n</script>');
  } else {
    inline.push('<script>\n/* Embedded offline asset: ' + local + ' */\n' +
      safeForScript(data) + '\n</script>');
  }
}
// Embed all local MathLive @font-face sources as data URLs; the standalone
// HTML must not depend on neighboring files, CSS, or a CDN.
const fontsTag='<link rel="stylesheet" href="./vendor/mathlive-fonts.css">';
if(!html.includes(fontsTag))throw Error('Missing MathLive font CSS link.');
const rawCss=fs.readFileSync(path.join(directory,'vendor','mathlive-fonts.css'),'utf8');
let fontsInlined=0;
const css=rawCss.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g,(match,q,url)=>{
  if(/^(?:data:|https?:|\/\/|\/)/i.test(url))throw Error('Font URL is not local: '+url);
  const local=url.split(/[?#]/)[0];
  const full=path.resolve(directory,'vendor',local);
  const fontRoot=path.resolve(directory,'vendor','fonts')+path.sep;
  if(!full.startsWith(fontRoot)||!fs.existsSync(full))
    throw Error('MathLive CSS references a missing font: '+url);
  const ext=path.extname(full).toLowerCase();
  const mime=ext==='.woff2'?'font/woff2':ext==='.woff'?'font/woff':
    ext==='.ttf'?'font/ttf':ext==='.otf'?'font/otf':null;
  if(!mime)throw Error('Unrecognized font extension: '+ext);
  fontsInlined++;
  return 'url("data:'+mime+';base64,'+fs.readFileSync(full).toString('base64')+'")';
});
if(fontsInlined<5)throw Error('MathLive CSS had too few embedded font references.');
html=html.replace(fontsTag,'<style id="embedded-mathlive-fonts">\n'+
  css.replace(/<\/style/gi,'<\\/style')+'\n</style>');
const licenses = [
  ['mathjax', 'MATHJAX-LICENSE.txt'],
  ['nerdamer', 'NERDAMER-LICENSE.txt'],
  ['cortexjs', 'CORTEXJS-LICENSE.txt'],
  ['mathlive', 'MATHLIVE-LICENSE.txt']
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
if (!html.includes('data:font/woff2;base64,'))
  throw Error('Missing MathLive data-url font faces in single file.');
if (/<link[^>]*href=[^>]*mathlive-fonts\.css/i.test(html))
  throw Error('Standalone HTML still loads the folder-only CSS.');
const outputPath = path.join(directory, 'calculus-lab-single-file.html');
fs.writeFileSync(outputPath, html);
console.log('Wrote self-contained offline HTML:', outputPath, fs.statSync(outputPath).size, 'bytes');
