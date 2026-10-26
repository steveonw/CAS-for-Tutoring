# JavaScript step-by-step Calculus I tutor: research and verified spike

**Research date:** 2026-10-26

## Conclusion

**CortexJS Compute Engine** is the strongest fit for the missing explanation layer. The public `Expression.explain()` API returns a mathematical state, stable rule identifier, English description, and final result. It supports `simplify`, `solve`, `D` (differentiation), and `Integrate` (when integration rules are loaded). This is a genuine recorded transformation trace rather than a post-hoc invented explanation.

Use **MathLive** as a possible equation editor (with local fonts), continue **MathJax** for read-only LaTeX, and keep **Nerdamer** as an independent fallback / cross-check until CortexJS is validated against a larger Calculus I corpus.

## Directly verified in our repository

The isolated spike at `research/cortex-step-spike/` pins `@cortex-js/compute-engine@0.159.0` and uses Node 22. The GitHub Actions run succeeded: https://github.com/steveonw/CAS-for-Tutoring/actions/runs/40375528748

| Input | Operation | Recorded steps | Outcome |
|---|---|---:|---|
| (x²−1)/(x−1) | simplify | 1 | x+1; cancellation rule identified |
| 2x+1=5 | solve | 2 | x=2; move terms and isolate |
| (x²+3)^4 | differentiate | 3 | 8x(x²+3)^3 |
| x sin x | differentiate | 2 | x cos x + sin x |
| (x²+1)/x | differentiate | 4 | (x²−1)/x² |
| ∫x² dx | integrate | 1 | x³/3; Rubi rule |
| ∫x√(1+x) dx | integrate | 5 | rule expansion, sum split, constant factor, integration rules |

**Result: 7/7 smoke scenarios returned nonempty result and step arrays.** These checks confirm that the API operates; they are *not yet* comprehensive independent correctness, domain, or pedagogy tests. The browser-targeted esbuild bundle (including optional Rubi rules) built successfully at approximately **11.1 MB uncompressed** (minified). That is feasible for offline packaging, but startup performance, memory use, and browser compatibility still need testing.

The chain-rule trace actually returned IDs `derivative.power-rule`, `derivative.sum-rule`, `derivative.power-rule`. The integral trace included machine IDs such as `integrate.sum`, `integrate.constant-factor`, and `rubi:...`.

## Library comparison

| Component | What it contributes | Recommendation |
|---|---|---|
| [CortexJS Compute Engine](https://github.com/cortex-js/compute-engine) | Real `.explain()` trace for derivatives, simplification, solving, and integration via optional Rubi corpus; LaTeX / MathJSON interchange | **Primary step engine** |
| [MathLive](https://github.com/arnog/mathlive) | Editable mathematical input, on-screen math keyboard, LaTeX / MathJSON | Add as user-input layer once the core trace UI works |
| [MathJax](https://www.mathjax.org/) | High-quality offline formula rendering (already bundled) | Keep |
| [Nerdamer](https://nerdamer.com/) | Existing project symbolic CAS for final answers | Retain temporarily as reference / fallback |
| [math.js](https://mathjs.org/) | Expression AST, custom rewrite rules; `derivative(..., {simplify:false})` exposes unsimplified result | Secondary option; less direct than CortexJS for multi-step calculus |
| [Google mathsteps](https://github.com/google/mathsteps) | Named algebra simplification and equation-solving steps | **Not core**: archived 2024, and no documented calculus step coverage |
| SymPy + Pyodide | Broad symbolic math from Python hosted in a browser, potential integration rule trees | Fallback if JS integrals cannot cover needed coursework; substantially heavier |

## Suggested architecture

1. **Math input:** MathLive `<math-field>` or existing text / LaTeX field; validate and parse through CortexJS into a MathJSON expression tree.
2. **Step generator:** Call `expr.explain('D', {variable:'x'})`, `expr.explain('solve')`, `expr.explain('simplify')`, or `expr.explain('Integrate')` with `loadIntegrationRules(ce)`.
3. **Teaching controller:** Display one `step.value.latex` at a time; use `step.id` and `step.description` to attach *Why?*, hints, textbook crosswalks, and student-attempt prompts.
4. **Verification:** Compare final results to Nerdamer/SymPy on test problems and check intermediate transformations, excluded values, and domain assumptions. Do not claim unsupported CAS results are proven.
5. **Presentation:** Render TeX with the locally bundled MathJax; show before/after, rule name and optional explanatory text.
6. **Offline packaging:** Use esbuild to create a local JS bundle; pin versions and include licenses. Copy MathLive fonts when introducing it. Avoid any runtime CDN.

## Important gaps and educational issues

- **Limits:** CortexJS documents `explain()` for `simplify`, `solve`, `D` and `Integrate`, not stepwise limit evaluation. We need a separate rule-based limit tutor (factor, rationalize, one-sided limits, trig limits, squeeze, etc.).
- **Integration wording:** The current Rubi explanation may say only 'Apply integration rule 1.1.1.1#15'. Convert known rule IDs to human-readable descriptions and show substitution or algebra when meaningful.
- **Canonicalization:** The engine may simplify some structure before recording the first step. Our UI must distinguish untraced normalization from a teachable transformation.
- **Domain handling:** Cancellation such as (x²−1)/(x−1) loses the excluded point x=1 if the original domain is not carried forward. Preserve assumptions and restrictions alongside every trace.
- **Bundle size:** The proof bundle is 11.1 MB before compression; optimize, consider dynamic optional Rubi loading from local files, and check on older laptops.
- **Student practice:** The engine yields a trace, but we must still build 'Try next step', hint levels, mistake diagnostics, and verification of mathematically equivalent student responses.
- **Coverage:** Seven successful smoke cases do not guarantee every calculus problem has a trace. Add tests for product/quotient/chain rules, inverse trig, logarithmic derivatives, u-substitution, integration by parts, implicit differentiation, and unsupported cases.

## Practical next step

Introduce CortexJS behind a **new guided derivative mode** alongside—not replacing—the current Nerdamer tool. Run a 30–50-problem textbook-based regression set, then add the rule-by-rule UI, guided hints, and active steps. Expand integrals after checking rule descriptions; handle limits separately.

## Primary sources

- https://mathlive.io/compute-engine/guides/simplify/ (step trace API, output shape and operation list)
- https://mathlive.io/compute-engine/guides/integration-rules/ (Rubi add-on)
- https://mathlive.io/compute-engine/api/ (`ExplainOptions` and `ExplainOperation`)
- https://mathlive.io/mathlive/guides/integration/ (local MathLive bundling and fonts)
- https://mathjs.org/docs/reference/functions/derivative.html (unsimplified derivatives)
- https://mathjs.org/docs/reference/functions/simplify.html (rewrite rules)
- https://github.com/google/mathsteps (archived; algebra examples)
- https://github.com/steveonw/CAS-for-Tutoring/actions/runs/40375528748 (our measured results)
