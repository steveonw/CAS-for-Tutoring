# JavaScript CAS + MathJax offline edition

A **JavaScript alternative to the Python/SymPy CAS**. Nerdamer 2.0.0 calculates symbolic math, and the same **MathJax 3.2.2 SVG** pattern used in [EquationWright](https://github.com/steveonw/equationwright) displays results as LaTeX. Both libraries are packaged locally.

## Features

- Differentiate, integrate, simplify, expand, factor, solve equations for x, and evaluate supported limits.
- Choose **Calculator syntax** or **LaTeX input**. Example LaTeX input: `\\frac{x^3}{3}`.
- See the problem and computed answer typeset as textbook mathematics, including integrals, fractions, roots and derivatives.
- Expand *View / select LaTeX source* to copy the computed answer into notes.
- Open the bundled **learn.html** for a step-by-step derivative demonstration, with local MathJax enhancing supported rule expressions.
- No runtime network, server, API key, or student-account requirement.

## Download: no development tools required

Open the latest successful [JavaScript CAS workflow](../.github/workflows/javascript-cas.yml) on GitHub Actions and download the **math-dreamweaver-offline-js-cas-latex** artifact. Unzip the archive, keep the files together, and double-click `index.html`. It also contains `learn.html` and **`calculus-lab-single-file.html`**. You can copy that one file by itself to run the CAS.

## Build it yourself (one-time online installation)

Install Node.js 20+ and run:

```bash
cd js-cas
npm install
npm test
npm run build:offline
```

Then copy the entire `js-cas/offline/` folder to your offline computer. The builder also creates **`calculus-lab-single-file.html`**: a self-contained HTML calculator with embedded Nerdamer and MathJax. It includes third-party license texts in HTML `<template>` elements.

The folder-based edition copies:
- `vendor/nerdamer.bundle.js` (Nerdamer 2.0.0)
- `vendor/mathjax-tex-svg.js` (MathJax 3.2.2)
- `vendor/NERDAMER-LICENSE.txt` and `vendor/MATHJAX-LICENSE.txt`
- `cas-adapter.js`, plus enhanced `learn.html`.

## Implementation

- `lib/cas-adapter.js` — symbolically computes and converts to/from TeX; disallows unsupported TeX macros.
- `offline/index.html`, `app.js` — accessible browser interface and copyable TeX source.
- `offline/mathjax-config.js` — local MathJax TeX-to-SVG configuration.
- `offline/lesson-math.js` — TeX-enhanced rendering of supported derivative tutor steps.
- `scripts/build-offline.cjs` — pinned offline package generator with license verification.
- `test/cas.test.cjs` — symbolic, TeX and safety checks.

## Educational boundaries

A symbolic **answer** is not the same thing as the underlying human-worked **steps**. The CAS interface currently emits *study prompts*, which are expressly not a trace of the CAS internal algorithms. The separate lesson covers selected elementary derivative rules but cannot explain arbitrary advanced calculus problems.

Nerdamer and LaTeX syntax are restricted to variable x and supported functions. Integral display includes `+ C`. Domain assumptions and non-elementary integrals can still require human checking.

## Licensing and privacy

Our project code is MIT. Nerdamer and MathJax are independently Apache-2.0; their licenses are copied into the generated offline package. The application has no telemetry or runtime network requirement. No EquationWright application source is copied; its offline MathJax technique is the architectural reference.
