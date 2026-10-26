# JavaScript CAS + MathJax offline edition

A **fully offline JavaScript CAS and guided Calculus I derivative tutor**. Nerdamer 2.0.0 computes the symbolic result, CortexJS Compute Engine 0.159.0 records the *actual derivative transformations* and rule IDs, and locally bundled MathJax 3.2.2 displays mathematical steps as LaTeX. It follows the offline packaging pattern of [EquationWright](https://github.com/steveonw/equationwright).

## Features

- **Built-in derivative breakdown**: real CortexJS `explain('D')` transformations, each rendered as a formula with the rule and a textbook reference.
- **One step at a time**: previous/next, reveal all, hidden final CAS answer, “Why this rule?”, and a hint/quiz that lets you predict which rule comes next.
- **Cross-engine check**: where provable by CortexJS, the derivative result is symbolically compared with Nerdamer. Other cases are labeled as unconfirmed, not automatically correct.

- Differentiate, integrate, simplify, expand, factor, solve equations for x, and evaluate supported limits.
- Choose **Calculator syntax** or **LaTeX input**. Example LaTeX input: `\\frac{x^3}{3}`.
- See the problem and computed answer typeset as textbook mathematics, including integrals, fractions, roots and derivatives.
- Expand *View / select LaTeX source* to copy the computed answer into notes.
- Open the bundled **learn.html** for a step-by-step derivative demonstration, with local MathJax enhancing supported rule expressions.
- No runtime network, server, API key, or student-account requirement.

## Download: no development tools required

Open the latest successful [JavaScript CAS workflow](../.github/workflows/javascript-cas.yml) on GitHub Actions and download the **math-dreamweaver-calculus-lab-guided-steps** artifact. Unzip the archive, keep the files together, and double-click `index.html`. It also contains `learn.html` and **`calculus-lab-single-file.html`**. You can copy that one file by itself to run the CAS.

## Build it yourself (one-time online installation)

Install Node.js 22+ and run:

```bash
cd js-cas
npm install
npm test
npm run build:offline
```

Then copy the entire `js-cas/offline/` folder to your offline computer. The builder also creates **`calculus-lab-single-file.html`**: a self-contained HTML calculator with embedded Nerdamer, CortexJS and MathJax, including the derivative walkthrough. It includes third-party license texts in HTML `<template>` elements.

The folder-based edition copies:
- `vendor/nerdamer.bundle.js` (Nerdamer 2.0.0)
- `vendor/step-engine.bundle.js` (CortexJS Compute Engine 0.159.0)
- `vendor/mathjax-tex-svg.js` (MathJax 3.2.2)
- `vendor/NERDAMER-LICENSE.txt`, `vendor/MATHJAX-LICENSE.txt`, and `vendor/CORTEXJS-LICENSE.txt`
- `cas-adapter.js`, plus enhanced `learn.html`.

## Implementation

- `lib/cas-adapter.js` — symbolically computes and converts to/from TeX; disallows unsupported TeX macros.
- `offline/index.html`, `app.js` — accessible browser interface and copyable TeX source.
- `offline/mathjax-config.js` — local MathJax TeX-to-SVG configuration.
- `offline/lesson-math.js` — TeX-enhanced rendering of supported derivative tutor steps.
- `scripts/build-offline.cjs` — pinned offline package generator with license verification.
- `lib/step-engine.mjs` — verified derivative step recorder using CortexJS `explain()` and rule-specific teaching hints.
- `test/cas.test.cjs` and `test/step-engine.test.mjs` — CAS, LaTeX, derivative steps, rule-check and safety checks.

## Educational boundaries

For **supported derivatives**, the CAS interface now uses CortexJS's recorded transformations, rather than generic study prompts. Students can reveal one step at a time, read the engine's explanation, see the Thompson chapter reference, and predict the next rule. The rule-choice checker assesses **rule identification only**, not an arbitrary mathematical expression. For unsupported derivatives, integrals, limits, factoring, and solving, it still shows a CAS result with an explicit limitation notice. No complete breakdown is claimed for those operations.

Nerdamer and LaTeX syntax are restricted to variable x and supported functions. Integral display includes `+ C`. Domain assumptions and non-elementary integrals can still require human checking.

## Licensing and privacy

Our project code is MIT. Nerdamer and MathJax are Apache-2.0; CortexJS is under its separately included license. All third-party license texts are copied into the offline package. The application has no telemetry or runtime network requirement. No EquationWright application source is copied; its offline MathJax technique is the architectural reference.
