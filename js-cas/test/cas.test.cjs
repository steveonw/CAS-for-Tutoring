const test = require('node:test');
const assert = require('node:assert/strict');
const nerdamer = require('nerdamer');
const app = require('../lib/cas-adapter.js');

function equivalent(actual, expected) {
  return nerdamer.simplify('(' + actual + ')-(' + expected + ')').text() === '0';
}
test('power and linear differentiation', function () {
  const result = app.calculate('differentiate', 'x^3+2*x');
  assert.ok(equivalent(result.answer, '3*x^2+2'), result.answer);
});
test('chain-rule computation', function () {
  const result = app.calculate('differentiate', '(x^2+3)^4');
  assert.ok(equivalent(result.answer, '8*x*(x^2+3)^3'), result.answer);
});
test('basic integration and integration constant display', function () {
  const result = app.calculate('integrate', 'x^2');
  assert.ok(equivalent(result.answer, 'x^3/3'), result.answer);
  assert.match(result.displayAnswer, /\+ C$/);
});
test('expansion and factoring', function () {
  const expanded = app.calculate('expand', '(x+1)^3').answer;
  assert.ok(equivalent(expanded, 'x^3+3*x^2+3*x+1'), expanded);
  const factored = app.calculate('factor', 'x^2-9').answer;
  assert.ok(equivalent(factored, 'x^2-9'), factored);
});
test('solve and limit output', function () {
  const roots = app.calculate('solve', 'x^2-4').answer;
  assert.match(roots, /2/);
  const limit = app.calculate('limit', 'sin(x)/x', {point:'0'}).answer;
  assert.ok(equivalent(limit, '1'), limit);
});
test('unsupported name, bad syntax and unsupported operations are rejected', function () {
  assert.throws(() => app.calculate('simplify', 'alert(x)'), /Unsupported name/);
  assert.throws(() => app.calculate('simplify', 'x;evil()'), /math.*notation/i);
  assert.throws(() => app.calculate('execute', 'x'), /Unknown CAS operation/);
});
