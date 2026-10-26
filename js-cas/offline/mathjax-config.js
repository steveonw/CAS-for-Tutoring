/* Bundled MathJax: same pinned TeX-to-SVG approach as EquationWright v7.3.
 * No external fonts, CDN, or remote extensions are loaded by this configuration.
 */
window.MathJax = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
    // CortexJS serializes Euler's constant with this TeX macro.
    macros: { exponentialE: '\\mathrm{e}' }
  },
  svg: { fontCache: 'local' },
  startup: { typeset: false },
  options: { enableMenu: false }
};
