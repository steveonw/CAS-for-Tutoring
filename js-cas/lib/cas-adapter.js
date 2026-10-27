/* Math Dreamweaver — shared Node/browser CAS adapter.
 * Nerdamer computes symbolic results; MathJax (in the browser) only renders TeX.
 * Study prompts are NOT a claim about internal step-by-step CAS derivations.
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
  // A deliberately conservative LaTeX input subset. Rendering a TeX string
  // is not permission to execute arbitrary TeX macros or HTML extensions.
  var allowedLatexCommands = new Set([
    'frac', 'dfrac', 'tfrac', 'sqrt', 'sin', 'cos', 'tan',
    'ln', 'log', 'exp', 'pi', 'cdot', 'times', 'left', 'right'
  ]);

  function validateExpression(text, label) {
    if (typeof text !== 'string' || !text.trim() || text.length > 180) {
      throw new Error((label || 'Expression') + ' must be 1–180 characters.');
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

  function validateLatex(text) {
    if (typeof text !== 'string' || !text.trim() || text.length > 240) {
      throw new Error('LaTeX input must be 1–240 characters.');
    }
    if (!/^[A-Za-z0-9+\-*/^().,=\s\\{}\[\]]+$/.test(text)) {
      throw new Error('Unsupported LaTeX characters. Use fractions, roots, powers, and elementary functions.');
    }
    var commands = text.match(/\\[A-Za-z]+/g) || [];
    for (var i = 0; i < commands.length; i++) {
      var name = commands[i].slice(1);
      if (!allowedLatexCommands.has(name)) {
        throw new Error('Unsupported LaTeX command: ' + commands[i]);
      }
    }
    // Reject stray backslashes, including \\, \;, and other non-command sequences.
    var withoutCommands = text.replace(/\\[A-Za-z]+/g, '');
    if (withoutCommands.indexOf('\\') >= 0) {
      throw new Error('LaTeX backslashes must introduce a supported command.');
    }
    var freeWords = withoutCommands.match(/[A-Za-z]+/g) || [];
    for (var j = 0; j < freeWords.length; j++) {
      if (!new Set(['x', 'pi', 'e', 'E']).has(freeWords[j])) {
        throw new Error('Only the variable x and supported constants are allowed.');
      }
    }
    return text.trim();
  }

  function textOf(result) {
    return result && typeof result.text === 'function'
      ? result.text() : String(result);
  }

  function parseInput(expression, format) {
    if (format === 'cas') return validateExpression(expression, 'Expression');
    if (format !== 'latex') throw new Error('Unknown input format.');
    var latex = validateLatex(expression);
    try {
      var parsed = nerdamer.convertFromLaTeX(latex);
      return validateExpression(textOf(parsed), 'Parsed LaTeX expression');
    } catch (err) {
      throw new Error('Unable to interpret this LaTeX input: ' + (err && err.message ? err.message : String(err)));
    }
  }

  function teXOf(value) {
    // Nerdamer 2.0 exports TeX from expressions and also a public converter.
    // A missing converter must not be passed off as a valid mathematical formula.
    if (value && typeof value.toTeX === 'function') {
      try {
        var rendered = value.toTeX();
        if (typeof rendered === 'string' && rendered.trim())
          return rendered.replace(/\\mathrm\s*\{\s*log\s*\}/g, '\\ln');
      } catch (ignored) { /* use converter below */ }
    }
    var latex = nerdamer.convertToTeX(textOf(value));
    if (typeof latex !== 'string' || !latex.trim()) throw new Error('CAS did not return displayable LaTeX.');
    // Nerdamer's log(x) is the natural logarithm. Its TeX serializer emits
    // \mathrm{log}, which CortexJS interprets as base 10. Normalize the
    // *trusted Nerdamer serialization* to \ln before displaying or tracing.
    // Do not rewrite arbitrary user LaTeX or a base-specific logarithm.
    return latex.replace(/\\mathrm\s*\{\s*log\s*\}/g, '\\ln');
  }

  function relevantRules(expression, operation) {
    // These are learning cues, not a transcript of how Nerdamer calculated.
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

  function operationTeX(operation, expressionTex, pointTex) {
    switch (operation) {
      case 'differentiate': return '\\frac{d}{dx}\\left(' + expressionTex + '\\right)';
      case 'integrate': return '\\int\\left(' + expressionTex + '\\right)\\,dx';
      case 'limit': return '\\lim_{x\\to ' + pointTex + '}\\left(' + expressionTex + '\\right)';
      default: return expressionTex;
    }
  }

  function calculate(operation, expression, opts) {
    opts = opts || {};
    if (!operations.includes(operation)) throw new Error('Unknown CAS operation.');
    var variable = opts.variable || 'x';
    if (variable !== 'x') throw new Error('This version works with x only.');
    var format = opts.inputFormat || 'cas';
    var input = parseInput(expression, format);
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

    var latexExpression, latexAnswer, latexPoint;
    try {
      latexExpression = teXOf(nerdamer(input));
    } catch (ignoredInput) {
      // Validated LaTeX source can be displayed directly; never use unvalidated user input.
      latexExpression = format === 'latex' ? validateLatex(expression) : null;
    }
    try { latexAnswer = teXOf(result); }
    catch (ignoredOutput) { latexAnswer = null; }
    if (point !== null) {
      try { latexPoint = teXOf(nerdamer(point)); }
      catch (ignoredPoint) { latexPoint = point; }
    }
    var latexOperation = latexExpression
      ? operationTeX(operation, latexExpression, latexPoint) : null;
    var displayLatex = latexAnswer
      ? latexAnswer + (operation === 'integrate' ? ' + C' : '') : null;

    return {
      operation: operation,
      inputFormat: format,
      expression: input,
      answer: answer,
      displayAnswer: answer + (operation === 'integrate' ? ' + C' : ''),
      latexExpression: latexExpression,
      latexOperation: latexOperation,
      latexAnswer: latexAnswer,
      displayLatex: displayLatex,
      latexAvailable: !!(latexOperation && displayLatex),
      studyPrompts: relevantRules(input, operation),
      explanationStatus: 'CAS result only — no verified step-by-step derivation yet.',
      library: 'Nerdamer 2.0.0'
    };
  }

  // Convert a *validated* calculator expression to TeX for the step
  // checker. This is notation conversion, not a proof of equivalence and
  // not a record of a derivative transformation.
  function inputToLatex(text, format) {
    if (format === 'latex') return validateLatex(text);
    return teXOf(nerdamer(parseInput(text, 'cas')));
  }

  return Object.freeze({
    calculate: calculate,
    operations: operations.slice(),
    parseInput: parseInput,
    inputToLatex: inputToLatex,
    validateLatex: validateLatex
  });
});
