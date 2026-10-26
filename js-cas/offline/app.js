/* Browser UI for the locally packaged JavaScript CAS. No network requests. */
(function () {
  'use strict';
  var el = function (id) { return document.getElementById(id); };
  var op = el('operation'), expr = el('expression'), point = el('point');
  var output = el('output'), limitEntry = el('limit-entry');
  var button = el('calculate');
  function sync() { limitEntry.hidden = op.value !== 'limit'; }
  op.addEventListener('change', sync);
  sync();
  function show(message, className) {
    var p = document.createElement('p');
    p.className = className || '';
    p.textContent = message;
    output.appendChild(p);
  }
  function run() {
    output.replaceChildren();
    if (!window.MathDreamweaverCAS) {
      show('Offline CAS bundle missing. Run npm install, then npm run build:offline inside js-cas.', 'error');
      return;
    }
    try {
      var result = window.MathDreamweaverCAS.calculate(op.value, expr.value, { point: point.value });
      show('CAS answer:', 'note');
      show(result.displayAnswer, 'math');
      show(result.explanationStatus, 'note');
      var title = document.createElement('strong'); title.textContent = 'Concepts to study'; output.appendChild(title);
      var list = document.createElement('ul');
      for (var i = 0; i < result.studyPrompts.length; i++) {
        var li = document.createElement('li'); li.textContent = result.studyPrompts[i]; list.appendChild(li);
      }
      output.appendChild(list);
    } catch (err) { show(err.message || String(err), 'error'); }
  }
  button.addEventListener('click', run);
  expr.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  point.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  run();
})();