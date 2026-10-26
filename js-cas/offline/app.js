/* Offline CAS UI with real CortexJS derivative steps.
 * Nerdamer solves; CortexJS explain(D) supplies recorded transformations;
 * MathJax renders TeX. No server or generated HTML from user input.
 */
(function () {
  'use strict';
  var el = function (id) { return document.getElementById(id); };
  var op = el('operation'), expr = el('expression'), format = el('input-format');
  var point = el('point'), output = el('output'), limitEntry = el('limit-entry');
  var button = el('calculate'), help = el('input-help'), example = el('example');
  var runId = 0;
  var renderQueue = Promise.resolve();
  var examples = [
    { op: 'differentiate', format: 'cas', expression: '(x^2+3)^4' },
    { op: 'differentiate', format: 'cas', expression: 'x*sin(x)' },
    { op: 'differentiate', format: 'cas', expression: '(x^2+1)/x' },
    { op: 'differentiate', format: 'latex', expression: '\\frac{x^3}{3}' },
    { op: 'integrate', format: 'cas', expression: 'x^2' },
    { op: 'limit', format: 'cas', expression: 'sin(x)/x', point: '0' }
  ];
  var exampleIndex = 0;
  function sync() {
    limitEntry.hidden = op.value !== 'limit';
    help.textContent = format.value === 'latex'
      ? 'LaTeX examples: \\frac{x^3}{3}, \\sqrt{x^2+1}, \\sin(x). Only basic commands are supported.'
      : 'Derivative examples: (x^2+3)^4, x*sin(x), (x^2+1)/x. Ctrl+Enter to calculate.';
  }
  format.addEventListener('change', sync);
  op.addEventListener('change', sync);
  sync();

  function text(parent, tag, content, className) {
    var node = document.createElement(tag);
    node.textContent = content;
    if (className) node.className = className;
    parent.appendChild(node);
    return node;
  }
  function appendButton(parent, label, click, css) {
    var btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = label;
    if (css) btn.className = css;
    btn.addEventListener('click', click);
    parent.appendChild(btn);
    return btn;
  }
  function formula(parent, latex, fallback) {
    var node = text(parent, 'div', latex ? '\\[' + latex + '\\]' : fallback, 'math');
    return node;
  }
  function queueTypeset(node) {
    if (!window.MathJax || !window.MathJax.startup) return;
    renderQueue = renderQueue.then(function () {
      return window.MathJax.startup.promise;
    }).then(function () {
      if (node.isConnected) return window.MathJax.typesetPromise([node]);
    }).catch(function () {
      // Keep raw TeX visible if the offline renderer cannot typeset this step.
    });
  }
  function updateFormula(node, latex) {
    if (window.MathJax && window.MathJax.typesetClear) {
      try { window.MathJax.typesetClear([node]); } catch (ignored) { /* no recorded MathItem */ }
    }
    node.textContent = '\\[' + latex + '\\]';
    queueTypeset(node);
  }
  function showSource(parent, latex) {
    if (!latex) return;
    var details = document.createElement('details');
    parent.appendChild(details);
    text(details, 'summary', 'View and copy answer LaTeX');
    var ta = document.createElement('textarea');
    ta.id = 'latex-source'; ta.readOnly = true; ta.rows = 3; ta.value = latex;
    details.appendChild(ta);
    appendButton(details, 'Copy answer LaTeX', function (event) {
      var target = event.currentTarget;
      ta.focus(); ta.select();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(function () {
          target.textContent = 'Copied';
        }).catch(function () { target.textContent = 'Select text and copy'; });
      } else target.textContent = 'Select text and copy';
    }, 'secondary');
  }
  function showAnswer(parent, result) {
    var heading = text(parent, 'h2', 'CAS answer');
    heading.className = 'answer-title';
    var f = formula(parent, result.displayLatex, result.displayAnswer);
    if (!result.latexAvailable) text(parent,'p','LaTeX unavailable; showing the CAS text output.','note');
    showSource(parent, result.displayLatex);
    queueTypeset(f);
  }
  function showPrompts(parent, result) {
    var list = document.createElement('ul');
    text(parent, 'h2', 'Concepts to review');
    result.studyPrompts.forEach(function (message) { text(list, 'li', message); });
    parent.appendChild(list);
  }

  function guidedWalkthrough(parent, trace, result, requestId) {
    var steps = trace.steps, index = 0, revealedAll = false, answerShown = false;
    var lesson = document.createElement('section'); lesson.className = 'walkthrough';
    parent.appendChild(lesson);
    text(lesson, 'h2', 'Step-by-step breakdown (' + steps.length + ' recorded steps)');
    text(lesson, 'p', 'Every displayed transformation and rule description comes from CortexJS explain(D), not from a guessed solution.', 'note');
    var cross = trace.agreement === true
      ? 'The recorded derivative agrees symbolically with Nerdamer.'
      : 'CortexJS and Nerdamer have not established symbolic agreement for this input. Check advanced problems independently.';
    text(lesson, 'p', cross, 'note');

    var card = document.createElement('div'); card.className = 'step-card'; lesson.appendChild(card);
    var progress = text(card, 'h3', '');
    var stateMath = formula(card, '', '');
    var rule = text(card, 'p', '');
    var source = text(card, 'p', '', 'note');
    var why = text(card, 'p', '');
    var more = text(card, 'p', '', 'note');
    more.hidden = true;

    var nav = document.createElement('div'); nav.className = 'step-nav'; lesson.appendChild(nav);
    var prev = appendButton(nav, 'Previous step', function () { index--; draw(); }, 'secondary');
    var next = appendButton(nav, 'Next step', function () {
      if (index < steps.length - 1) { index++; draw(); }
      else revealAnswer();
    });
    appendButton(nav, 'Why this rule?', function () { more.hidden = !more.hidden; }, 'secondary');

    var practice = document.createElement('div'); practice.className = 'practice'; lesson.appendChild(practice);
    text(practice, 'h3', 'Predict the next rule');
    text(practice, 'p', 'Before revealing the next step, identify the rule that will be applied.', 'note');
    var label = text(practice, 'label', 'Select a rule');
    var choice = document.createElement('select'); choice.setAttribute('aria-label','Predict the next rule');
    label.appendChild(choice);
    var empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Choose a rule'; choice.appendChild(empty);
    window.MathDreamweaverSteps.ruleChoices.forEach(function (option) {
      var item = document.createElement('option'); item.value = option.value;
      item.textContent = option.label; choice.appendChild(item);
    });
    var feedback = text(practice, 'p', '', 'note'); feedback.setAttribute('aria-live','polite');
    var practiceActions = document.createElement('div'); practice.appendChild(practiceActions);
    appendButton(practiceActions, 'Check my choice', function () {
      if (!choice.value) { feedback.textContent = 'Choose a rule first.'; return; }
      var correct = window.MathDreamweaverSteps.checkNextRule(trace, index, choice.value);
      feedback.textContent = correct
        ? 'Correct! That is the next recorded rule. Reveal the step to see how it is applied.'
        : 'Not quite. Look at the expression and try another rule, or ask for a hint.';
    });
    appendButton(practiceActions, 'Hint', function () {
      feedback.textContent = steps[index + 1].hint;
    }, 'secondary');

    var allBox = document.createElement('div'); allBox.className = 'all-steps'; allBox.hidden = true;
    lesson.appendChild(allBox);
    appendButton(lesson, 'Show all transformations', function (event) {
      if (!revealedAll) {
        revealedAll = true;
        var list = document.createElement('ol'); allBox.appendChild(list);
        steps.forEach(function (step) {
          var li = document.createElement('li'); list.appendChild(li);
          text(li,'strong',step.rule);
          formula(li,step.latex,step.latex);
          text(li,'p',step.reason);
        });
        queueTypeset(allBox);
      }
      allBox.hidden = !allBox.hidden;
      event.currentTarget.textContent = allBox.hidden ? 'Show all transformations' : 'Hide all transformations';
    }, 'secondary');

    var answerArea = document.createElement('div'); answerArea.className = 'answer-area'; answerArea.hidden = true;
    parent.appendChild(answerArea);
    appendButton(lesson, 'Reveal final CAS answer', revealAnswer, 'secondary');

    function revealAnswer() {
      if (requestId !== runId) return;
      if (!answerShown) { answerShown = true; showAnswer(answerArea, result); }
      answerArea.hidden = false;
    }
    function draw() {
      if (requestId !== runId) return;
      var step = steps[index];
      progress.textContent = 'Step ' + (index + 1) + ' of ' + steps.length + ' — ' + step.rule;
      updateFormula(stateMath, step.latex);
      rule.textContent = 'Rule: ' + step.reason;
      source.textContent = 'Rule ID: ' + step.id + ' · ' + step.textbook;
      why.textContent = step.reason;
      more.textContent = step.hint + ' ' + step.textbook;
      more.hidden = true;
      prev.disabled = index === 0;
      next.textContent = index === steps.length - 1 ? 'Reveal final answer' : 'Next step';
      practice.hidden = index === steps.length - 1;
      choice.value = '';
      feedback.textContent = '';
    }
    draw();
  }

  function run() {
    runId++;
    var id = runId;
    if (window.MathJax && window.MathJax.typesetClear) {
      try { window.MathJax.typesetClear([output]); } catch (ignored) {}
    }
    output.replaceChildren();
    if (!window.MathDreamweaverCAS) {
      text(output, 'p', 'CAS missing. Build the offline package and reopen this file.', 'math-error');
      return;
    }
    var result;
    try {
      result = window.MathDreamweaverCAS.calculate(op.value, expr.value, {
        inputFormat: format.value, point: point.value
      });
    } catch (err) {
      text(output, 'p', err.message || String(err), 'math-error');
      return;
    }
    text(output, 'h2', 'Your problem');
    formula(output, result.latexOperation, result.expression);
    var guided = false;
    if (result.operation === 'differentiate' && result.latexExpression && window.MathDreamweaverSteps) {
      try {
        var trace = window.MathDreamweaverSteps.explainDerivative(result.latexExpression, {
          checkLatex: result.latexAnswer
        });
        guidedWalkthrough(output, trace, result, id);
        guided = true;
      } catch (error) {
        text(output, 'p', 'A verified derivative breakdown is unavailable: ' + error.message, 'note');
      }
    }
    if (!guided) {
      if (result.operation === 'differentiate') {
        text(output, 'p', 'No recorded steps were available for this problem. Showing the CAS answer instead.', 'note');
      } else {
        text(output, 'p', 'Step-by-step tracing is currently available for derivatives only. Other operations still calculate normally.', 'note');
      }
      showAnswer(output, result);
      text(output, 'p', result.explanationStatus, 'note');
      showPrompts(output, result);
    }
    queueTypeset(output);
  }

  button.addEventListener('click', run);
  expr.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
  point.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  example.addEventListener('click', function () {
    var entry = examples[++exampleIndex % examples.length];
    op.value = entry.op; format.value = entry.format; expr.value = entry.expression;
    point.value = entry.point || '0'; sync(); run();
  });
  run();
})();
