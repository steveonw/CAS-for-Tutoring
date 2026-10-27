/* Offline CAS UI with real CortexJS derivative steps.
 * Nerdamer solves; CortexJS explain(D) supplies recorded transformations;
 * MathJax renders TeX. No server or generated HTML from user input.
 */
(function () {
  'use strict';
  var el = function (id) { return document.getElementById(id); };
  var op = el('operation'), expr = el('expression'), format = el('input-format');
  var point = el('point'), output = el('output'), limitEntry = el('limit-entry');
  var mode = el('study-mode');
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
    button.textContent = mode.value === 'tutor' ? 'Start guided practice' : 'Calculate and typeset';
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
    // Step 0 is a real decision point, not an already-revealed transformation.
    var steps = trace.steps, index = -1, revealedAll = false, answerShown = false;
    var lesson = document.createElement('section'); lesson.className = 'walkthrough';
    parent.appendChild(lesson);
    text(lesson, 'h2', 'Step-by-step breakdown (' + steps.length + ' recorded steps)');
    text(lesson, 'p', 'Start by choosing a rule and trying the next expression. The mathematical transformations are recorded by CortexJS explain(D), not invented after the result.', 'note');
    var verification = trace.verification || {};
    var cross = verification.status === 'symbolic'
      ? 'CortexJS and Nerdamer agree by the symbolic equivalence check.'
      : verification.status === 'samples-consistent'
        ? 'Values match at ' + verification.samplesChecked + ' sampled points. This is NOT proof of equivalence: domain assumptions still matter.'
        : 'Symbolic agreement has not been established. Check advanced problems independently.';
    text(lesson, 'p', cross, 'note');
    text(lesson,'p','Practice checking can confirm a recorded form or engine-proven equivalence, or find a numerical counterexample. It cannot establish all domain restrictions.','note');

    var card = document.createElement('div'); card.className = 'step-card'; lesson.appendChild(card);
    var progress = text(card, 'h3', '');
    var beforeLabel = text(card, 'p', 'Before this rule', 'note');
    var beforeMath = formula(card, '', '');
    var afterLabel = text(card, 'p', 'After this rule', 'note');
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
    text(practice, 'p', 'Choose which rule should be applied BEFORE revealing the next equation.', 'note');
    var label = text(practice, 'label', 'Select a rule');
    var choice = document.createElement('select'); choice.id = 'next-rule';
    label.htmlFor = choice.id;
    var empty = document.createElement('option'); empty.value = ''; empty.textContent = 'Choose a rule'; choice.appendChild(empty);
    window.MathDreamweaverSteps.ruleChoices.forEach(function (option) {
      var item = document.createElement('option'); item.value = option.value;
      item.textContent = option.label; choice.appendChild(item);
    });
    practice.appendChild(choice);
    var feedback = text(practice, 'p', '', 'note'); feedback.classList.add('rule-feedback');
    feedback.setAttribute('aria-live', 'polite');
    var practiceActions = document.createElement('div'); practice.appendChild(practiceActions);
    appendButton(practiceActions, 'Check my choice', function () {
      if (!choice.value) { feedback.textContent = 'Choose a rule first.'; return; }
      var correct = window.MathDreamweaverSteps.checkNextRule(trace, index, choice.value);
      feedback.textContent = correct
        ? 'Correct! That is the next recorded rule. Reveal the step when you are ready.'
        : 'Not quite. Think about the expression, or ask for a hint.';
    });
    appendButton(practiceActions, 'Hint', function () {
      feedback.textContent = steps[index + 1].hint;
    }, 'secondary');

    var entry = document.createElement('div'); entry.className = 'step-entry';
    practice.appendChild(entry);
    text(entry,'h3','Write the next mathematical line');
    text(entry,'p','Enter an intermediate expression in calculator syntax, or choose LaTeX. A correct final answer that skips several recorded steps will be identified as a skip, not the requested next transformation.','note');
    var inputLabel = text(entry, 'label', 'Your next step');
    inputLabel.htmlFor = 'student-next-step';
    var attempt = document.createElement('textarea');
    attempt.id = 'student-next-step'; attempt.rows = 2;
    attempt.autocapitalize = 'off'; attempt.autocomplete = 'off'; attempt.spellcheck = false;
    attempt.placeholder = 'e.g. 4*(x^2+3)^3*2*x';
    entry.appendChild(attempt);
    var typeLabel = text(entry,'label','My input notation');
    typeLabel.htmlFor = 'student-step-format';
    var attemptFormat = document.createElement('select'); attemptFormat.id = typeLabel.htmlFor;
    [['cas','Calculator syntax'],['latex','LaTeX notation']].forEach(function (choice) {
      var option = document.createElement('option'); option.value = choice[0];
      option.textContent = choice[1]; attemptFormat.appendChild(option);
    });
    attemptFormat.value = format.value;
    entry.appendChild(attemptFormat);
    var graded = text(entry,'p','','note'); graded.id = 'student-feedback';
    graded.setAttribute('role','status'); graded.setAttribute('aria-live','polite');
    appendButton(entry, 'Check my step', function () {
      if (!attempt.value.trim()) { graded.textContent='Enter an expression to check.';return; }
      if (requestId !== runId) return;
      try {
        var latex = attemptFormat.value === 'cas'
          ? window.MathDreamweaverCAS.inputToLatex(attempt.value, 'cas')
          : attempt.value;
        var checked = window.MathDreamweaverSteps.checkStudentStep(trace,index,latex);
        graded.textContent = checked.message;
        graded.dataset.status = checked.status;
        graded.className = checked.status === 'counterexample' || checked.status === 'invalid'
          ? 'math-error' : 'note';
      } catch (error) {
        graded.textContent = 'Cannot check this line: ' + (error.message || String(error));
        graded.dataset.status = 'invalid'; graded.className = 'math-error';
      }
    });
    appendButton(entry, 'Hint for my next line', function () {
      graded.textContent = steps[index + 1].hint;
      graded.dataset.status = 'hint'; graded.className = 'note';
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
          text(li,'p','Before','note');
          formula(li,step.beforeLatex,step.beforeLatex);
          text(li,'p','After','note');
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
      var isStart = index === -1;
      var step = isStart ? null : steps[index];
      progress.textContent = isStart
        ? 'Step 0 — Choose the first rule'
        : 'Step ' + (index + 1) + ' of ' + steps.length + ' — ' + step.rule;
      beforeLabel.textContent = isStart ? 'Start with the unsolved derivative' : 'Before this rule';
      updateFormula(beforeMath, isStart ? trace.initialLatex : step.beforeLatex);
      afterLabel.hidden = isStart;
      stateMath.hidden = isStart;
      if (!isStart) updateFormula(stateMath, step.latex);
      rule.textContent = isStart
        ? 'No transformation has been revealed yet. Which rule would you apply first?'
        : 'Rule: ' + step.rule;
      source.textContent = isStart
        ? 'Identify the rule, then try writing your own next line.'
        : 'Engine rule ID: ' + step.id + ' · ' + step.textbook;
      why.textContent = isStart
        ? 'The first decision is to recognize the structure of the expression before differentiating.'
        : step.reason;
      more.textContent = isStart ? steps[0].hint : step.hint;
      more.hidden = true;
      prev.disabled = isStart;
      next.textContent = isStart ? 'Reveal step 1' :
        index === steps.length - 1 ? 'Reveal final answer' : 'Next step';
      practice.hidden = index === steps.length - 1;
      choice.value = ''; feedback.textContent = '';
      attempt.value = ''; graded.textContent = ''; graded.dataset.status = '';
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
    if (/\blog\s*\(/.test(result.expression)) {
      text(output, 'p', 'Here log means the natural logarithm (ln). For real-valued log, the argument must be positive.', 'note');
    }
    if (/^abs\s*\(x\)$/.test(result.expression)) {
      text(output, 'p', 'The derivative of |x| is not defined at x = 0.', 'note');
    }
    if (/^x\^x$/.test(result.expression)) {
      text(output, 'p', 'For the real logarithmic differentiation of x^x, assume x > 0.', 'note');
    }
    if (mode.value === 'calculator') {
      text(output,'p','Calculator Mode: immediate Nerdamer result. This mode does not certify a step-by-step derivation.','note');
      showAnswer(output,result);
      showPrompts(output,result);
      queueTypeset(output);
      return;
    }
    var guided = false;
    if (result.operation === 'differentiate' && result.latexExpression && window.MathDreamweaverSteps) {
      try {
        var trace = window.MathDreamweaverSteps.explainDerivative(result.latexExpression, {
          checkLatex: result.latexAnswer
        });
        if (trace.verification && trace.verification.status === 'conflict') {
          text(output, 'p', 'Mathematical disagreement detected between the two symbolic engines. The walkthrough and final answer are withheld to avoid teaching a potentially incorrect result.', 'math-error');
          if (trace.verification.mismatches.length) {
            var m = trace.verification.mismatches[0];
            text(output, 'p', 'At x = ' + m.x + ', CortexJS gives ' +
              m.traceValue + ' while Nerdamer gives ' + m.casValue + '.', 'note');
          }
        } else {
          guidedWalkthrough(output, trace, result, id);
        }
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
  mode.addEventListener('change', function () { sync(); run(); });
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
