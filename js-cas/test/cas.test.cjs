const test = require('node:test');
const assert = require('node:assert/strict');
const nerdamer = require('nerdamer');
const app = require('../lib/cas-adapter.js');
const fs = require('node:fs');
const path = require('node:path');

function equivalent(actual, expected) {
  return nerdamer.simplify('(' + actual + ')-(' + expected + ')').text() === '0';
}

test('power and linear differentiation', function () {
  const result = app.calculate('differentiate', 'x^3+2*x');
  assert.ok(equivalent(result.answer, '3*x^2+2'), result.answer);
  assert.ok(result.latexAvailable, 'Derivative must have LaTeX output');
  assert.match(result.latexOperation, /\\frac\{d\}\{dx\}/);
});
test('chain-rule computation', function () {
  const result = app.calculate('differentiate', '(x^2+3)^4');
  assert.ok(equivalent(result.answer, '8*x*(x^2+3)^3'), result.answer);
  assert.ok(result.displayLatex.includes('x'));
});
test('integration constant in both plain and TeX answers', function () {
  const result = app.calculate('integrate', 'x^2');
  assert.ok(equivalent(result.answer, 'x^3/3'), result.answer);
  assert.match(result.displayAnswer, /\+ C$/);
  assert.match(result.displayLatex, /\+ C$/);
  assert.match(result.latexOperation, /\\int/);
});
test('expansion and factoring', function () {
  const expanded = app.calculate('expand', '(x+1)^3').answer;
  assert.ok(equivalent(expanded, 'x^3+3*x^2+3*x+1'), expanded);
  const factored = app.calculate('factor', 'x^2-9').answer;
  assert.ok(equivalent(factored, 'x^2-9'), factored);
});
test('solve and limit output', function () {
  const roots = app.calculate('solve', 'x^2-4');
  assert.match(roots.answer, /2/);
  const limit = app.calculate('limit', 'sin(x)/x', {point:'0'});
  assert.ok(equivalent(limit.answer, '1'), limit.answer);
  assert.match(limit.latexOperation, /\\lim_/);
});
test('converts conservative LaTeX input into a mathematical expression', function () {
  const result = app.calculate('differentiate', '\\frac{x^3}{3}', {inputFormat:'latex'});
  assert.ok(equivalent(result.answer, 'x^2'), result.answer);
  assert.equal(result.inputFormat, 'latex');
  assert.ok(result.latexExpression.length > 0);
});
test('validates LaTeX input syntax and rejects arbitrary commands', function () {
  assert.throws(() => app.calculate('differentiate', '\\href{javascript:alert(1)}{x}', {inputFormat:'latex'}), /Unsupported/);
  assert.throws(() => app.calculate('differentiate', '\\htmlClass{x}{x}', {inputFormat:'latex'}), /Unsupported/);
  assert.throws(() => app.calculate('differentiate', '\\frac{x^2}{y}', {inputFormat:'latex'}), /Only the variable x/);
  assert.throws(() => app.calculate('differentiate', 'x;alert(1)', {inputFormat:'latex'}), /Unsupported/);
});
test('unsupported CAS input and operations are rejected', function () {
  assert.throws(() => app.calculate('simplify', 'alert(x)'), /Unsupported name/);
  assert.throws(() => app.calculate('simplify', 'x;evil()'), /math.*notation/i);
  assert.throws(() => app.calculate('execute', 'x'), /Unknown CAS operation/);
});
test('browser bundle uses local MathJax and exposes TeX sources', function () {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'offline', 'index.html'), 'utf8');
  const js = fs.readFileSync(path.resolve(__dirname, '..', 'offline', 'app.js'), 'utf8');
  assert.match(html, /vendor\/mathjax-tex-svg\.js/);
  assert.match(html, /vendor\/nerdamer\.bundle\.js/);
  assert.match(html, /input-format/);
  assert.match(js, /typesetPromise/);
  assert.match(js, /latex-source/);
  assert.ok(!/<script[^>]*src="https?:/i.test(html), 'No remote JavaScript in offline app');
});
