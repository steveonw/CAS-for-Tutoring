# LaTeX integration — from EquationWright to Math Dreamweaver

## Reference implementation inspected

EquationWright v7.3: https://github.com/steveonw/equationwright

The implementation basis is its `README_v7_3.md`, `make_offline_build.py`, `scripts/fetch_mathjax.py`, and `THIRD_PARTY_NOTICES.md`. EquationWright pins **MathJax 3.2.2**, uses the **TeX→SVG** browser bundle (`tex-svg.js`), and packages it locally into an offline distribution. Its online and offline editions retain identical assessment mathematics. We adopt that **distribution architecture**, not EquationWright's specific worksheet generator or authored app source.

## Our separation of responsibilities

1. **Nerdamer 2.0.0** parses CAS syntax or a restricted subset of LaTeX (`convertFromLaTeX`), computes a symbolic answer, and serializes supported results to TeX (`toTeX`).
2. **MathJax 3.2.2 (tex-svg)** only formats the TeX on screen; its presence does not change any CAS mathematics.
3. **Teaching layer** attaches human-readable rules and, in the separate step tutor, limited explicit intermediate expressions. Do not call CAS study prompts a complete derivation.
4. **Offline packager** copies both libraries from pinned npm packages into `js-cas/offline/vendor/`, preserves licenses, and enhances a copy of the original rule tutor with the local MathJax renderer. No runtime CDN calls. An additional `calculus-lab-single-file.html` build embeds the complete MathJax and Nerdamer bundles into one HTML file, including readable third-party license texts.

The `js-cas/offline/index.html` and `learn.html` pages use only relative file paths. Both remain available via ordinary `file://` browsing after packaging. The unmodified root `index.html` still runs without a dependency folder.

## LaTeX input subset

Current accepted commands: `\\frac`, `\\dfrac`, `\\tfrac`, `\\sqrt`, `\\sin`, `\\cos`, `\\tan`, `\\ln`, `\\log`, `\\exp`, `\\pi`, `\\cdot`, `\\times`, `\\left`, and `\\right`. Only variable `x` is supported. This is not an unrestricted LaTeX parser or a full equation editor.

Examples:
- Calculator: `(x^2+3)^4`
- LaTeX: `\\frac{x^3}{3}`
- LaTeX: `\\sqrt{x^2+1}`
- LaTeX: `\\sin(x)`

The accepted command whitelist is deliberately strict. MathJax is configured with local SVG font paths and without remote script or menu dependencies. The UI inserts formulas as **text nodes**, not HTML; the TeX input validator rejects HTML and unsupported commands (including `\\href` and HTML extensions).

The raw answer TeX can be selected and copied for notes. The browser's clipboard API may be restricted under `file://` URLs; in that case, use the visible selectable source field.

## Tests, packaging and licensing

```sh
cd js-cas
npm install
npm test
npm run build:offline
```

The CI job verifies elementary calculus, TeX output and input conversion, adversarial TeX inputs, local-only script paths, and the presence of `nerdamer.bundle.js`, `mathjax-tex-svg.js` and preserved third-party licenses.

Our own code: repository's original MIT license.
Nerdamer: Apache License 2.0 (copy retained as `NERDAMER-LICENSE.txt`).
MathJax: Apache License 2.0 (copy retained as `MATHJAX-LICENSE.txt`).
MathJax attribution: https://www.mathjax.org and https://github.com/mathjax/MathJax-src

## Next iteration

Expand the *teaching*, not just typography: AST-backed transformations, domain-aware validation, hints, student's next step, and exact algebra/derivative checking. Consider a separate MathLive-like visual editor once input grammar and security contracts are mature.
