# JavaScript CAS and Tutor Mode — v0.5.1

A **fully offline JavaScript CAS and guided Calculus I derivative tutor**. Nerdamer 2.0.0 computes the symbolic result, CortexJS Compute Engine 0.159.0 records the *actual derivative transformations* and rule IDs, and locally bundled MathJax 3.2.2 displays mathematical steps as LaTeX. It follows the offline packaging pattern of [EquationWright](https://github.com/steveonw/equationwright).

## Features

**New in v0.5.1:** Correct student answers earn credit even if they bypass engine-created intermediate `d/dx` expressions. The app advances to the matched later step or final result; students can still review all recorded working. A strict calculator-to-LaTeX converter preserves typed grouping and arithmetic before comparison. **Chain rule** is accepted as an alternative initial rule for appropriate composite expressions. The diagnostic library recognizes additional known wrong forms: multiplying product derivatives, reversed quotient-rule subtraction, leaving a power unchanged, and forgetting the inner derivative of `e^(3*x)`. Mathematical caveats are collapsed; domain notes appear only when relevant. See [Tutor Mode guide](../docs/TUTOR_MODE.md).


**New in v0.5.0:** The student next-line checker now preserves original calculator input before simplification, reviews recognized denominator/logarithm/radical restrictions, and warns when a proposed line introduces a new undefined point such as `2*x^2/x` at `x=0` for the derivative of `x^2`. It gives **evidence-backed** feedback for common chain-rule (missing inner derivative), product-rule (missing term), quotient-rule (plus instead of minus), and constant-rule errors. Each diagnosis requires a matched wrong mathematical expression and a counterexample against the real-domain-allowed correct derivative. These checks remain partial, not a universal domain solver. See [Tutor Mode guide](../docs/TUTOR_MODE.md).


**New in v0.4.0:** Tutor Mode (default) starts at Step 0, before any derivative step is revealed. Students identify the *first* rule, can type a proposed next line in calculator or restricted LaTeX syntax, receive cautious math-engine feedback, and then reveal the recorded transformation. Calculator Mode shows the Nerdamer answer immediately. Read [Tutor Mode guide](../docs/TUTOR_MODE.md) for the input and verification limitations.


**v0.3.1 correctness fixes:** `log(x)` has the same natural-logarithm meaning in both engines (displayed as `\ln`), `\exponentialE` renders in offline MathJax, all emitted differentiation rule IDs have student-readable names, and true numerical coefficients are taught as the constant-multiple rule. Each step shows the before and after expressions. Exact repeated steps are omitted.

- **Built-in derivative breakdown**: real CortexJS `explain('D')` transformations, each rendered as a formula with the rule and a textbook reference.
- **One step at a time**: Step 0 first-rule prediction, typed next line, previous/next, reveal all, hidden final CAS answer, “Why this rule?”, and hints.
- **Cross-engine check**: CortexJS/Nerdamer symbolic comparisons are supplemented with finite real-domain numeric samples. A counterexample blocks the derivative walkthrough and final answer; matching samples alone are **not** proof of equivalence. Unknown results are marked as unconfirmed.

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
npm run test:browser
npm run test:render
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
- `test/derivative-corpus.test.mjs` — strict 26-problem derivative regression set and log/constant/chain-rule validation.
- `test/tutor-practice.test.mjs` — Step 0, typed work, skip-ahead and input-safety regression tests.
- `test/domain-diagnostics.test.mjs` — domain boundaries, removable singularities, original problem exclusions, and named misconception checks.
- `lib/domain-guard.mjs`, `lib/practice-diagnostics.mjs` — conservative domain conditions and evidence-backed diagnostic patterns.
- `test/render-check.browser.cjs` — required MathJax error audit in Chrome, including exponentials.
- `npm run audit:rules` — inspect engine rule IDs and actual AST transformations when extending calculus coverage.

## Educational boundaries

For **supported derivatives**, the CAS interface now uses CortexJS's recorded transformations, rather than generic study prompts. Students can reveal one step at a time, read the engine's explanation, see the Thompson chapter reference, and predict the next rule. The rule-choice checker assesses **rule identification**. Student-entered expressions are evaluated conservatively: exact recorded step, symbolically equivalent under engine assumptions, skipped final answer, numerical counterexample or unverified. Neither symbolic simplification nor matching numerical samples is a complete domain-aware proof. For unsupported derivatives, integrals, limits, factoring, and solving, it still shows a CAS result with an explicit limitation notice. No complete breakdown is claimed for those operations.

Nerdamer and LaTeX syntax are restricted to variable x and supported functions. Integral display includes `+ C`. Domain assumptions and non-elementary integrals can still require human checking.

## Licensing and privacy

Our project code is MIT. Nerdamer and MathJax are Apache-2.0; CortexJS is under its separately included license. All third-party license texts are copied into the offline package. The application has no telemetry or runtime network requirement. No EquationWright application source is copied; its offline MathJax technique is the architectural reference.
