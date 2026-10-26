# AI HANDOFF — Math Dreamweaver: Calculus Lab

**Snapshot:** October 26, 2026  
**Repository:** https://github.com/steveonw/CAS-for-Tutoring  
**Reference branch and commit:** `main` at `83c5cc0fc7455f7568993fef241a845e8aa4e1c6`  
**Version:** JavaScript Calculus Lab `0.3.0` — working educational prototype.

> **For the next AI:** This is a dated snapshot, not a substitute for checking GitHub. Read the latest branch, source, tests, pull requests, and GitHub Actions before making changes. Preserve verified work. Do not claim a feature exists just because it is described as a goal below.

## 1. The user's actual goal

Build and own an **offline-first, step-by-step Calculus I computer algebra tutor**. It must explain *why each transformation is valid*, not just compute an answer. The user wants development to happen in their real GitHub repository, `steveonw/CAS-for-Tutoring`, not merely receive ZIP files to upload manually.

**Intended learning flow:** Enter a function in calculator syntax or LaTeX; see textbook-style equations; work through **real recorded intermediate math expressions**; see a named rule and explanation; ask **Why?**, request hints, predict or perform the next step, and check work. Retain a fully offline HTML distribution, preferably including a one-file option. Prefer clear, accurate math over flashy UI.

**Textbook guidance:** Silvanus P. Thompson, *Calculus Made Easy* (especially Chapters IV–VI and IX); OpenStax *Calculus Volume 1* for modern Calculus I limits, derivatives and integrals. The user has also referenced MTH 263. Another user project, [EquationWright](https://github.com/steveonw/equationwright), inspired the local MathJax / TeX-to-SVG distribution pattern. Do not copy its unrelated application code.

**Mathematical integrity:** Only show transformations recorded or verifiably justified by the engine. Never fabricate plausible intermediate steps. Explicitly label unsupported problems, partial explanations, domain restrictions and inconclusive symbolic checks.

## 2. Current implemented capabilities

The main JavaScript app is under `js-cas/`:

- **Nerdamer 2.0.0**: Computes supported derivatives, antiderivatives, simplification, expansion, factoring, equation solving for `x`, and limits. Converts between constrained LaTeX and the CAS notation.
- **CortexJS Compute Engine 0.159.0**: For **supported derivatives**, `expression.explain('D', {variable:'x'})` returns the recorded transformations, rule IDs, intermediate LaTeX and descriptions. The UI presents these actual steps; the CortexJS engine is not merely generating a commentary on Nerdamer's answer.
- **Guided differentiation interface**: Previous/Next step, Why this rule?, Hint, Predict next rule, Show all transformations and a final answer hidden until requested. A rule-quiz checks **which rule comes next**, not a student's arbitrary algebraic expression.
- **MathJax 3.2.2**: Locally bundled TeX-to-SVG renderer for readable fractions, powers, derivatives and answers. Users can select/copy an answer's LaTeX source.
- **Offline output**: Complete folder starting at `js-cas/offline/index.html`, plus generated, self-contained `calculus-lab-single-file.html`. A generated `learn.html` contains an enhanced copy of the older standalone derivative tutor.
- **Cross-engine results**: CortexJS may compare its derivative with Nerdamer using a three-valued outcome: `true`, `false` or **`null` (unproven/inconclusive)**. Do not call `null` a verified agreement.
- **Older root `index.html`**: Separate dependency-free derivative lesson prototype; keep it preserved.
- **Python alternative**: `desktop/calculus_lab_desktop.py`, an offline SymPy command-line CAS after dependency installation. It has broader computation but not universally exhaustive human-worked traces.

**NOT YET in the main guided UI:** Recorded integration and limit walkthroughs, full equation-solving breakdown, a MathLive visual equation editor, free-form student next-expression grading, and rigorous domain-aware reasoning. The Rubi-based integration trace in `research/` is an **experiment**, not a shipped feature.

## 3. Source code map

| Location | Purpose |
|---|---|
| `README.md` | Project overview / distribution instructions |
| `AI_HANDOFF.md` | This AI handoff at the repository root |
| `docs/SPEC.md` | Requirements and roadmap; some earlier paragraphs have been superseded by later additions |
| `docs/JS_STEP_TUTOR_RESEARCH_2026-10-26.md` | Math library research, architecture, and the CortexJS proof |
| `docs/JS_CAS_LIBRARIES.md` | Nerdamer, Math.js and Algebrite comparison |
| `docs/LATEX_INTEGRATION.md` | MathJax, EquationWright and restricted LaTeX input details |
| `js-cas/package.json` | Exact dependencies and npm commands |
| `js-cas/lib/cas-adapter.js` | Nerdamer symbolic calculation / TeX parsing and input validation |
| `js-cas/lib/step-engine.mjs` | CortexJS `explain('D')`, rule mapping, hints, rule quiz |
| `js-cas/offline/index.html` + `app.js` | Main UI, step navigation, rendering and fallback |
| `js-cas/offline/mathjax-config.js` | Offline MathJax setup |
| `js-cas/offline/lesson-math.js` | TeX enhancement for older tutor |
| `js-cas/scripts/build-offline.cjs` | Builds local folder, bundles CortexJS and third-party licenses |
| `js-cas/scripts/build-single-file.cjs` | Builds independently usable single HTML |
| `js-cas/test/cas.test.cjs` | Nerdamer, algebra, TeX, validation tests |
| `js-cas/test/step-engine.test.mjs` | Calculus step-trace an