/* Math Dreamweaver — shared Node/browser CAS adapter.
 * Nerdamer (Apache-2.0) performs symbolic calculations.
 * This adapter intentionally does NOT invent worked derivations.
 */
(function (host, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('nerdamer'));
  } else {
    host.MathDreamweaverCAS = factory(host.nerdamer);
  }
})(typeof window !== 'undefined' ? window : this, function (nerdamer) {
  'use strict';
  if (!nerdamer) throw new Error('Nerdamer CAS library not loaded.');

  var operations = Object.freeze([
    'differentiate', 'integrate', 'simplify', 'expand', 'factor', 'solve', 'limit'
  ]);
  var identifiers = new Set([
    'x', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot',
    'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
    'exp', 'log', 'sqrt', 'abs', 'pi', 'e', 'E'
  ]);

  function validateExpression(text, label) {
    if (typeof text !== 'string' || !text.trim() || text.length > 160) {
      throw new Error((label || 'Expression') + ' must be 1–160 characters.');
    }
    if (!/^[A-Za-z0-9+\-*/^().,=\s]+$/.test(text)) {
      throw new Error('Use mathematical notation only (no scripts or commands).');
    }
    var words = text.match(/[A-Za-z]+/g) || [];
    for (var i = 0; i < words.length; i++) {
      if (!identifiers.has(words[i])) {
        throw new Error('Unsupported name: ' + words[i]);
      }
    }
    return text.trim();
  }

  function textOf(result) {
    return result && typeof result.text === 'function'
      ? result.text() : String(result);
  }

  function relevantRules(expression, operation) {
    // Study prompts, not a claim about an actual internal CAS derivation.
    if (operation === 'differentiate') {
      var notes = ['Differentiate with respect to x; check the expression’s structure.'];
      if (/\b(sin|cos|tan)\s*\(/.test(expression)) notes.push('Review trigonometric derivative rules.');
      if (/\b(exp|log)\s*\(/.test(expression)) notes.push('Review exponential/logarithmic derivative rules.');
      if (/\)\s*\^/.test(expression)) notes.push('A chain-rule substitution may help with a powered composite.');
      if (/\bx\s*\^/.test(expression)) notes.push('Recall the power rule from Calculus Made Easy, Chapter IV.');
      return notes;
    }
    if (operation === 'integrate')
      return ['Find an antiderivative and add the arbitrary integration constant C.', 'Check by differentiating the proposed antiderivative.'];
    if (operation === 'limit')
      return ['Try direct substitution; if indeterminate, study the appropriate limit law or transformation.'];
    if (operation === 'solve')
      return ['Substitute each proposed root back into the original equation.'];
    return ['Check that the result is equivalent to the starting expression wherever both are defined.'];
  }

  function calculate(operation, expression, opts) {
    opts = opts || {};
    if (!operations.includes(operation)) throw new Error('Unknown CAS operation.');
    var variable = opts.variable || 'x';
    if (variable !== 'x') throw new Error('This version works with x only.');
    var input = validateExpression(expression, 'Expression');
    var point = operation === 'limit'
      ? validateExpression(String(opts.point === undefined ? '0' : opts.point), 'Limit point') : null;
    var result;
    try {
      switch (operation) {
        case 'differentiate': result = nerdamer.diff(input, variable); break;
        case 'integrate': result = nerdamer.integrate(input, variable); break;
        case 'simplify': result = nerdamer.simplify(input); break;
        case 'expand': result = nerdamer(input).expand(); break;
        case 'factor': result = nerdamer.factor(input); break;
        case 'solve': result = nerdamer.solve(input, variable); break;
        case 'limit': result = nerdamer.limit(input, variable, point); break;
      }
    } catch (err) {
      throw new Error('CAS could not evaluate this problem: ' + (err && err.message ? err.message : String(err)));
    }
    var answer = textOf(result);
    if (!answer || /^(integrate|limit|diff)\s*\(/i.test(answer)) {
      throw new Error('The CAS returned an unevaluated operation; no solution claimed.');
    }
    return {
      operation: operation, expression: input,
      answer: answer, displayAnswer: answer + (operation === 'integrate' ? ' + C' : ''),
      studyPrompts: relevantRules(input, operation),
      explanationStatus: 'CAS result only — no verified step-by-step derivation yet.',
      library: 'Nerdamer 2.0.0'
    };
  }

  return Object.freeze({ calculate: calculate, operations: operations.slice() });
});
