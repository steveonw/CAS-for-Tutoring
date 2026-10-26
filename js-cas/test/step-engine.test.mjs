import test from 'node:test';
import assert from 'node:assert/strict';
import { explainDerivative, checkNextRule, ruleChoices } from '../lib/step-engine.mjs';

test('chain rule shows actual intermediate states with named rules', () => {
  const trace = explainDerivative('(x^2+3)^4', {checkLatex:'8x(x^2+3)^3'});
  assert.equal(trace.steps.length, 3);
  assert.equal(trace.steps[0].id, 'derivative.power-rule');
  assert.equal(trace.steps[1].id, 'derivative.sum-rule');
  assert.equal(trace.steps[2].id, 'derivative.power-rule');
  assert.match(trace.steps[0].reason, /power rule/i);
  assert.match(trace.resultLatex, /8x/);
  assert.ok(trace.steps.every(s => !!s.latex && !!s.reason && !!s.hint));
  assert.ok(trace.steps.every(s => !!s.textbook));
  assert.equal(trace.agreement, true);
});
test('product and quotient rules show corresponding transformations', () => {
  const product = explainDerivative('x\\sin x');
  const quotient = explainDerivative('\\frac{x^2+1}{x}');
  assert.ok(product.steps.some(s => s.family === 'product'));
  assert.ok(quotient.steps.some(s => s.family === 'quotient'));
  assert.ok(product.steps.length > 1 && quotient.steps.length > 1);
});
test('predicting the next rule checks the real next trace step', () => {
  const trace = explainDerivative('(x^2+3)^4');
  assert.equal(checkNextRule(trace, 0, 'sum'), true);
  assert.equal(checkNextRule(trace, 0, 'product'), false);
  assert.equal(checkNextRule(trace, trace.steps.length - 1, 'power'), false);
  assert.ok(ruleChoices.some(c => c.value === 'known'));
});
test('does not fabricate steps for missing or unsafe input', () => {
  assert.throws(() => explainDerivative(''), /required/);
  assert.throws(() => explainDerivative('\\href{javascript:bad}{x}'), /Unsupported markup/);
  assert.throws(() => explainDerivative('<script>'), /Unsupported markup/);
});
