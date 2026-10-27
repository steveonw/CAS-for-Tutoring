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
| `js-cas/test/step-engine.test.mjs` | Calculus step-trace and cross-engine pipeline tests |
| `js-cas/test/browser-smoke.cjs` | Real Chrome checks against both offline distributions |
| `.github/workflows/javascript-cas.yml` | CI and downloadable app + QA artifacts |
| `research/cortex-step-spike/` | Isolated `explain()` exploration including Rubi integration |
| `desktop/` | Python/SymPy edition; `sympy>=1.12,<2` |
| `developer/` | Earlier experimental tests, **not integrated** into the shipped JS app |

## 4. Reproduce the working build

**Developer prerequisites:** Node.js **22+**, npm, and internet access only for first dependency installation. The **built app runs entirely offline**. The pinned JavaScript package versions are CortexJS `0.159.0`, Nerdamer `2.0.0`, MathJax `3.2.2`, esbuild `0.25.12`, Playwright `1.56.1`.

```bash
git clone https://github.com/steveonw/CAS-for-Tutoring.git
cd CAS-for-Tutoring/js-cas
npm install
npm test
npm run build:offline

# Double-click offline/index.html to use the folder-based app.
# Or copy and double-click offline/calculus-lab-single-file.html.
```

To run browser QA, build first and install **Google Chrome** on the test machine:

```bash
npm run test:browser
```

Browser tests use Playwright with `channel:'chrome'`; the GitHub workflow runs on `ubuntu-24.04` + Node 22, using its preinstalled Chrome. Run `npm run build:steps` if only the CortexJS browser bundle needs rebuilding.

The optional Python edition, **from the repository root**:

```bash
python -m pip install -r desktop/requirements.txt
python desktop/calculus_lab_desktop.py
```

The Python parser is meant for trusted local mathematical input, not arbitrary remote requests. The root `index.html` is separately usable by opening it with no build.

### Verified GitHub release artifact

As of this handoff, GitHub Actions run **[40378689247](https://github.com/steveonw/CAS-for-Tutoring/actions/runs/40378689247)** was **successful** for the reference `main` commit. It produced:

- **[math-dreamweaver-calculus-lab-guided-steps](https://github.com/steveonw/CAS-for-Tutoring/actions/runs/40378689247/artifacts/12676837055)** — the offline application distribution (folder version and standalone HTML).
- **[calculus-lab-browser-qa](https://github.com/steveonw/CAS-for-Tutoring/actions/runs/40378689247/artifacts/12676597269)** — Chrome test screenshots.

GitHub artifacts may expire. If a link no longer works, rebuild the project or rerun the workflow; do not assume the older download remains current.

### Confirmed tests

- **14 Node tests passed** using `npm test`: CAS and TeX conversion, validation, chain/product/quotient derivative traces, rule prediction and end-to-end Nerdamer→CortexJS input conversion.
- **Offline Chrome test passed** for both `file://` versions: step navigation, rule quiz, Why?, Show all, answer reveal, MathJax rendering, non-derivative fallbacks, no uncaught browser errors, and **no HTTP(S) network requests**.
- Most recent guided derivative work was merged via **[PR #4](https://github.com/steveonw/CAS-for-Tutoring/pull/4)** at `83c5cc0fc7455f7568993fef241a845e8aa4e1c6`. Earlier PRs: #1 Nerdamer, #2 MathJax/LaTeX, #3 CortexJS research.

**Example to test manually:** Choose Differentiate and enter `(x^2+3)^4`. The recorded trace has **3 steps** and ultimately yields `8x(x^2+3)^3`. Also try `x*sin(x)` (product rule) and `(x^2+1)/x` (quotient rule). Tests cover specific representative cases, **not universal correctness**.

## 5. Important limitations and pitfalls

1. **Stepwise UI currently supports differentiation only.** Other Nerdamer operations deliberately display a result plus a statement that no complete step trace is available.
2. **Some pedagogy needs improvement.** "Why this rule?" can repeat the original rule description. Thompson references are introductory rule/chapter pointers, not carefully verified quotations or exact textbook page citations.
3. **Mathematical equality can be inconclusive.** A comparison for `(x^2+1)/x` returned `null`, meaning CortexJS could not *prove* equivalence to Nerdamer's formatted answer; it is not a detected contradiction.
4. **Domain restrictions need proper tracking.** In the research case `(x^2-1)/(x-1)`, cancellation must preserve the excluded input `x = 1`. Record assumptions in each transformation before calling expressions equivalent.
5. **Integration:** The separate CortexJS/Rubi research spike traced `∫x² dx` and `∫x√(1+x) dx`, but some descriptions are opaque, such as "Apply integration rule 1.1.1.1#15". That engine is **not loaded by the shipped guided UI**. A robust student-facing integration layer is future work.
6. **Limits:** The researched `explain()` API did not offer a documented step-by-step limit mode. Build limits separately: substitution, factoring, rationalization, one-sided reasoning, trig limits, continuity, etc.
7. **MathLive is research-only.** There is currently no installed MathLive visual math field. The UI has a textarea and a calculator/LaTeX notation selector; supported names/macros are intentionally limited.
8. **Single-file implementation caution:** `build-single-file.cjs` embeds the *trusted build-time* CortexJS JavaScript as base64 and evaluates it locally because directly inserting its large bundle into HTML caused a parser syntax error. This is **not evaluation of user input**, but is a CSP/security/maintainability tradeoff. Retain the browser smoke test when changing it.
9. **Licensing/privacy:** Preserve the original project MIT `LICENSE`; retain separately packaged third-party licenses/notices for Nerdamer, MathJax and CortexJS. Do not commit tokens, student records, private homework or personal data.
10. **Documentation is layered:** `docs/SPEC.md` retains historical limitations alongside newer implemented features. The latest source and tests outrank stale paragraphs. Update docs after shipping changes.
11. **Avoid false offline claims:** npm installation is an online build step; the *generated distribution* is offline, without runtime CDN. Check both folder and single-file apps for accidental network requests.

## 6. What to build next, in order

**A. Teach genuine student-written next steps.** Let learners enter the next algebra/derivative expression; compare it safely with the recorded transformation, carry domain assumptions forward, and explain errors. Preserve the existing simpler multiple-choice rule quiz. Provide progressive hints without revealing the answer too early.

**B. Make the existing derivative explanations better.** Explain inner/outer functions for chain rule, give concrete before→after equations, display proper algebraic simplifications, and improve "Why?" so it adds information beyond repeating a description. Map rules to *Calculus Made Easy* / OpenStax with verified references. Add regression problems for trig, exponential, logarithmic and nested derivatives.

**C. Add actual integration breakdowns.** Investigate the demonstrated `explain('Integrate')` / Rubi rules; translate valid machine IDs into student-friendly power, u-substitution, algebraic rewrite and integration-by-parts reasoning. Test against representative Calculus I exercises and mark unsupported cases.

**D. Handle limits rigorously.** Design an independently audited rule-based trace layer; do not reconstruct fictional steps from a final numerical limit.

**E. Improve input and accessibility.** Consider offline MathLive with bundled fonts, plus reliable keyboard entry, responsive mobile layout and screen reader labels. Don't make typing LaTeX mandatory.

**F. Increase mathematical verification.** Maintain a 30–100-problem corpus with correct answers, domains, transformations, unsupported cases, tests against a second symbolic engine and numerical checks where mathematically valid.

**G. Keep the repo reliable.** Update `README.md`, `docs/SPEC.md` and this handoff on meaningful changes. Keep the single-file offline artifact functional and third-party licenses intact.

## 7. Future AI working agreement

- The user explicitly wants an AI assistant to **work directly in the GitHub repository**. Past assistance successfully used the GitHub connector with write permission. **Access permissions do not carry across AI sessions automatically**—verify your own capability before promising a commit.
- Inspect latest `main`, GitHub Actions, open PRs, source code and tests **before** changing anything. If the reference commit here is old, update the snapshot and avoid replacing newer code.
- Prefer a small feature branch / PR and clear change description. Run `npm test`, `npm run build:offline`, `npm run test:browser` (or the equivalent complete CI) and verify the final `main` run and download. If something fails, report the real status rather than claiming success.
- Treat user mathematical learning as the product objective: **actual steps, WHY, hint/practice, reliable math, offline ownership**.
- Separate **implemented**, **tested prototype**, **proposed**, and **not supported** clearly. Do not pretend that Rubi integration or a MathLive editor is already in production.
- For any suspected mathematical discrepancy, preserve a reproducible test case and document whether it is a true contradiction, a domain issue, or an inconclusive simplifier result.
- Do not require the user to supply a GitHub token in chat; do not broaden permissions beyond the named repository without explicit need.

## 8. Paste this into another AI to resume

> I own an offline Calculus I tutoring project called **Math Dreamweaver: Calculus Lab**. The real code is at **https://github.com/steveonw/CAS-for-Tutoring**. First read the root **`AI_HANDOFF.md`** and verify the latest GitHub source, tests, open pull requests, and Actions. I want a **step-by-step educational CAS**, not just answers: actual intermediate equations, named rules, why each step works, hints, practice, LaTeX and fully offline use. The project currently uses **CortexJS + Nerdamer + MathJax**, plus a Python/SymPy alternative. The guided derivative breakdown is implemented and tested; **full integration, limits, and student-entered intermediate steps remain unfinished**. Work directly in the repository when the GitHub connector is available, preserve licenses and existing features, run full offline browser tests, and verify your commits and downloadable artifacts.

---

*End of handoff, dated October 26, 2026. Always recheck the live repository before treating this as current.*

## Post-snapshot correction (October 26, 2026)

The original contents above describe the earlier v0.3.0 snapshot. The [correctness update in PR #7](https://github.com/steveonw/CAS-for-Tutoring/pull/7) advances the JavaScript calculator to **v0.3.1**. It resolves the 26-problem corpus's known `log(x)` natural/base-10 mismatch, exponential-E rendering, missing differentiation rule IDs, and constant-multiple labels; adds before/after steps and a numerical-counterexample guard; and removes all 7 TODO test exemptions. The required CI now has **76 passing mathematical tests** and a blocking MathJax rendering audit. Read `docs/DERIVATIVE_CORPUS_REVIEW.md` and check the latest live GitHub Actions status before continuing. Step 0, true student-typed next steps, fully domain-aware proof and guided limits/integrals remain unfinished.

## v0.4.0 addition — Tutor Mode and Step 0 (October 26, 2026)

The browser now has **Tutor Mode** (default) and **Calculator Mode** (immediate result). Tutor Mode starts at **Step 0**, prompting identification of the **first rule** before showing a CortexJS transformation. A new student next-line field accepts calculator notation or restricted mathematical LaTeX. Its checking statuses distinguish the exact recorded next expression, engine-confirmed equivalence, a final answer that skips the next intermediate rule, a finite-real counterexample, invalid input and **unverified** work. Matching sampled values are **not** a proof of equivalence or of domain preservation. Both the offline directory and single-file HTML must keep passing browser smoke tests. The detailed usage and limitations are in `docs/TUTOR_MODE.md`.

The older v0.3.x statement above that student-typed steps were unavailable is now historical. **Still unfinished:** a general proof validator, complete domain assumptions, personalized mistake-diagnosis for all rules, guided integration and guided limits.

## v0.5.0 — Domain restrictions and misconception diagnosis (October 26, 2026)

The current browser Tutor Mode includes a **partial source-preserving real-domain scanner**, implemented in `js-cas/lib/domain-guard.mjs`. It examines known restrictions on denominators, logarithms, radicals and certain trigonometric functions, and conservatively flags some differentiability boundaries. The checker preserves **raw calculator notation before Nerdamer cancels factors**, so a newly introduced domain hole (e.g. `2*x^2/x` where `x=0` was originally allowed) can be rejected even if the resulting simplified TeX looks equivalent. Original problem exclusions continue to apply when a derivative simplifies.

`js-cas/lib/practice-diagnostics.mjs` provides a small **evidence-based mistake library**: chain-rule missing inner derivative, missing product-rule term, quotient-rule subtraction flipped to addition, dropped constant multiplier, and retaining a numerical constant. It only names a mistake after a matching symbolic wrong pattern **and** a counterexample to the correct derivative on a recognized valid source point. Anything unsupported remains unverified. This is not a proof engine or exhaustive domain solver. Read `docs/TUTOR_MODE.md` and the latest CI run before describing it as verified.

## v0.5.1 grading correction — October 26, 2026

**The earlier "correct final answer is skipped and wrong" behavior was replaced.** Students typing a valid complete derivative, including `4*(x^2+3)^3*2*x` for `(x^2+3)^4`, now **earn credit and advance** instead of being forced to reproduce engine-created half-differentiated `d/dx` expressions. The restricted `calculatorToLatex()` in `js-cas/lib/domain-guard.mjs` preserves typed arithmetic before canonical mathematical checking. `assessNextRule()` accepts chain reasoning for recognized composite expressions even when the recorded first step uses the power/exponential rule. The known-error library has expanded to recognize f′g′, reversed quotient numerator, unchanged powers, and exponential missing-inner-derivative errors when mathematically evidenced. Caveats are collapsible; domain notes only appear when found.

**New test source:** `js-cas/test/student-real-world.test.mjs` (six common correct student inputs, chain-rule alternatives, additional errors) and revised offline Chrome `browser-smoke.cjs`. Domain checking remains partial and symbolic equality is not unconditional proof. Check the latest GitHub Actions run. Guided limits and integrals remain unfinished.

## v0.6 proposed design (not implemented, October 26, 2026)

A collaborator's user-testing review and our technical follow-up produced [issue #11](https://github.com/steveonw/CAS-for-Tutoring/issues/11) and `docs/V0_6_TUTOR_DESIGN.md`. The **proposed** next milestone is part-aware derivative diagnosis (recognize correct outer/incorrect or missing inner derivatives), three hint levels tied to that diagnosis, a local MathLive visual editor alongside text inputs, and strict offline/MathJax/math regression tests. Do not claim any of this is shipped in v0.5.1. A valid partially evaluated `d/dx` line must not be rejected solely because it is not written as the final simplified derivative. Numerical samples are useful for low-stakes grading but do not prove global identity or preserve domains. Integration should follow before limits; privacy-controlled local mistake logging is a separate proposed milestone.

## v0.6.0-alpha.1 — Part-aware chain-rule tutoring shipped (October 26, 2026)

Following `docs/V0_6_TUTOR_DESIGN.md`, **phase 1 of issue #11 is implemented**. New `js-cas/lib/derivative-parts.mjs` uses the original unsimplified source AST to construct and symbolically verify supported outer and inner chain-rule derivatives. For `(3*x^2+1)^5`: a student's `5*(3*x^2+1)^4` is diagnosed **correct outer, missing inner**; `5*(3*x^2+1)^4*3*x` is **correct outer, incorrect inner**. Only supported structural factorizations and counterexamples on the recognized source domain earn this specific diagnosis. The UI typesets recognized parts separately and provides **three hint tiers**, with the worked expression hidden until the third. Legitimate partially evaluated TeX `\frac{d}{dx}` remains a valid next step. New `js-cas/test/derivative-parts.test.mjs` and offline Chrome tests enforce this behavior.

**Do NOT claim MathLive or all of v0.6 is completed.** The visual offline math editor, full general product/quotient component decomposition, and unrestricted math-proof validation are still open in issue #11. Check the latest GitHub Actions build and required math/Chrome/MathJax audits before merging additional code.
