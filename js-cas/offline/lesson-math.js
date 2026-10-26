/* Enhance the original rule tutor inside the offline package.
 * Translate only simple displays; leave unsupported steps in original text.
 */
(function () {
  'use strict';
  var element = document.getElementById('equation');
  if (!element || !window.nerdamer || !window.MathJax) return;
  var sequence = 0;

  function texPart(text) {
    var s = text.trim();
    if (s === 'f′(x)' || s === "f'(x)") return "f'(x)";
    var differential = /^d\/dx\((.*)\)$/.exec(s);
    if (differential) {
      return '\\frac{d}{dx}\\left(' + nerdamer.convertToTeX(differential[1]) + '\\right)';
    }
    return nerdamer.convertToTeX(s);
  }
  function texStep(raw) {
    var parts = raw.split(/\s*=\s*/);
    return parts.map(texPart).join(' = ');
  }
  function render() {
    sequence++;
    var stamp = sequence;
    var raw = element.textContent;
    var latex;
    try { latex = texStep(raw); } catch (ignored) { return; }
    if (window.MathJax.typesetClear) {
      try { window.MathJax.typesetClear([element]); } catch (ignoredClear) {}
    }
    element.textContent = '\\[' + latex + '\\]';
    Promise.resolve(window.MathJax.startup.promise)
      .then(function () { if (sequence === stamp) return window.MathJax.typesetPromise([element]); })
      .catch(function () { if (sequence === stamp) element.textContent = raw; });
  }
  ['go','back','next','example'].forEach(function (id) {
    var button = document.getElementById(id);
    if (button) button.addEventListener('click', render);
  });
  render();
})();
