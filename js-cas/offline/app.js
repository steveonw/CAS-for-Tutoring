/* Browser UI. Nerdamer does the math; local MathJax typesets the result.
 * No HTML insertion for formulas from the user or CAS. */
(function () {
  'use strict';
  var el = function (id) { return document.getElementById(id); };
  var op = el('operation'), expr = el('expression'), format = el('input-format');
  var point = el('point'), output = el('output'), limitEntry = el('limit-entry');
  var button = el('calculate'), help = el('input-help'), example = el('example');
  var currentLatex = '';
  var runId = 0;
  var examples = [
    { op: 'differentiate', format: 'cas', expression: '(x^2+3)^4' },
    { op: 'integrate', format: 'cas', expression: 'x^2' },
    { op: 'differentiate', format: 'latex', expression: '\\frac{x^3}{3}' },
    { op: 'differentiate', format: 'cas', expression: 'sin(x^2)' },
    { op: 'limit', format: 'cas', expression: 'sin(x)/x', point: '0' }
  ];
  var exampleIndex = 0;

  function sync() {
    limitEntry.hidden = op.value !== 'limit';
    help.textContent = format.value === 'latex'
      ? 'LaTeX examples: \\frac{x^3}{3}, \\sqrt{x^2+1}, \\sin(x). Only basic math commands are accepted.'
      : 'Calculator examples: (x^2+3)^4, sin(x), (x+1)^3, x^2-4.';
  }
  format.addEventListener('change', sync);
  op.addEventListener('change', sync);
  sync();

  function showText(container, text, className) {
    var p = document.createElement('p');
    p.className = className || '';
    p.textContent = text;
    container.appendChild(p);
    return p;
  }
  function showMath(latex, fallback) {
    var div = document.createElement('div');
    div.className = 'math';
    div.textContent = latex ? '\\[' + latex + '\\]' : (fallback || 'Formula unavailable');
    output.appendChild(div);
    return div;
  }

  function renderMath(id) {
    if (!window.MathJax || !window.MathJax.startup || !window.MathJax.startup.promise) {
      showText(output, 'MathJax was not packaged; showing raw LaTeX instead.', 'note');
      return;
    }
    Promise.resolve(window.MathJax.startup.promise)
      .then(function () {
        if (id !== runId) return;
        return window.MathJax.typesetPromise([output]);
      })
      .catch(function (err) {
        if (id === runId) showText(output, 'Could not render LaTeX: ' + String(err), 'math-error');
      });
  }

  function showSource(latex) {
    var detail = document.createElement('details');
    var summary = document.createElement('summary');
    summary.textContent = 'View / select LaTeX source';
    detail.appendChild(summary);
    var ta = document.createElement('textarea');
    ta.id = 'latex-source'; ta.readOnly = true; ta.rows = 3;
    ta.value = latex || '';
    detail.appendChild(ta);
    var copy = document.createElement('button');
    copy.type = 'button'; copy.textContent = 'Copy answer LaTeX';
    copy.addEventListener('click', function () {
      ta.focus(); ta.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value)
          .then(function () { copy.textContent = 'Copied LaTeX'; })
          .catch(function () { copy.textContent = 'Select text and copy'; });
      } else { copy.textContent = 'Select text and copy'; }
    });
    detail.appendChild(copy);
    output.appendChild(detail);
  }

  function run() {
    runId += 1;
    var id = runId;
    if (window.MathJax && window.MathJax.typesetClear) {
      try { window.MathJax.typesetClear([output]); } catch (ignored) { /* old result may be plain text */ }
    }
    output.replaceChildren();
    if (!window.MathDreamweaverCAS) {
      showText(output, 'Offline CAS missing. Build with npm install and npm run build:offline.', 'math-error');
      return;
    }
    var result;
    try {
      result = window.MathDreamweaverCAS.calculate(op.value, expr.value, {
        inputFormat: format.value, point: point.value
      });
    } catch (err) {
      showText(output, err.message || String(err), 'math-error');
      return;
    }
    var preview = document.createElement('section');
    preview.appendChild(Object.assign(document.createElement('h2'), {textContent:'Your problem'}));
    output.appendChild(preview);
    showMath(result.latexOperation, result.expression);
    output.appendChild(Object.assign(document.createElement('h2'), {textContent:'CAS result'}));
    showMath(result.displayLatex, result.displayAnswer);
    if (!result.latexAvailable) showText(output, 'TeX conversion unavailable for this result. Plain CAS output shown.', 'note');
    showText(output, result.explanationStatus, 'note');
    var heading = document.createElement('h2'); heading.textContent = 'Concepts to study'; output.appendChild(heading);
    var list = document.createElement('ul');
    result.studyPrompts.forEach(function (message) {
      var li = document.createElement('li'); li.textContent = message; list.appendChild(li);
    });
    output.appendChild(list);
    currentLatex = result.displayLatex || '';
    if (currentLatex) showSource(currentLatex);
    renderMath(id);
  }

  button.addEventListener('click', run);
  expr.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
  point.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  example.addEventListener('click', function () {
    var e = examples[++exampleIndex % examples.length];
    op.value = e.op; format.value = e.format; expr.value = e.expression;
    point.value = e.point || '0'; sync(); run();
  });
  run();
})();
