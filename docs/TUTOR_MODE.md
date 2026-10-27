# Tutor Mode — Step 0 and student-entered derivative steps

**Status:** Implemented in the offline JavaScript Calculus Lab v0.4.0 for supported derivatives. These checks are not a universal mathematical proof assistant.

## Two separate modes

**Tutor Mode** (default): enter `(x^2+3)^4` and select **Start guided practice**. Step 0 shows the original unsolved derivative. You can identify the **first rule**, ask for a hint, or write the next mathematical line before revealing the CortexJS transformation. Next/Previous, Why this rule?, Show all transformations, and Reveal final CAS answer remain available.

**Calculator Mode**: shows the Nerdamer result immediately. It does *not* claim to provide a complete derivation. Changing modes automatically resets the current lesson. For integrals, limits and other non-derivative operations, the calculator still provides the supported answer while stating that guided steps are unavailable.

## Writing a next step

Enter the proposed line in **Calculator syntax** (e.g. `2*x*cos(x^2)`) or select **LaTeX** for a TeX expression (e.g. `2x\cos(x^2)`). Some intermediate recorded steps include unevaluated derivative operators; for those, LaTeX or the Reveal step option is more appropriate.

The checker distinguishes:

- **Matched** — the line is exactly the recorded expression (including its source LaTeX), or parses to the same structured mathematical expression.
- **Equivalent** — CortexJS confirms symbolic equality to the next line under its assumptions. This is not certification of exactly the same method or all real domains.
- **Skipped ahead** — your expression is the final derivative but skips the intermediate step currently requested.
- **Counterexample** — the line and the next recorded expression produce different finite real values at a sample input. Such a discrepancy disproves identity at that point.
- **Unverified** — no established equivalence and no decisive counterexample. The answer is **not automatically marked incorrect**.
- **Invalid** — the restricted notation is unsupported or cannot be parsed.

**Mathematical caution:** Equal values at several test points do *not* prove that two expressions are identical everywhere. A symbolic simplifier also may not preserve input domains. The original domain, derivative existence, and the student's rule choice still matter.

## Worked examples

For `(x^2+3)^4`, Step 0 asks which rule to apply first. The first recorded rule is the **power rule** applied to a composite expression. The derivative of the inside, `2x`, appears in later steps. Entering the final result `8*x*(x^2+3)^3` immediately is correctly identified as skipping intermediate work.

For `sin(x^2)`, the **chain rule** is the first recorded transformation. Start by choosing that rule rather than seeing the answer.

For `log(x)`, this calculator consistently treats `log` as the **natural logarithm**. Be mindful of `x>0` in the real domain. For `abs(x)`, the derivative is undefined at `x=0`; the calculator still does not implement general formal domain tracking.

## Implementation and verification

- `js-cas/lib/step-engine.mjs`: `checkNextRule(trace,-1,...)` and `checkStudentStep(trace,index,latex)`.
- `js-cas/lib/cas-adapter.js`: validated `inputToLatex()` for student calculator notation.
- `js-cas/offline/app.js`: Tutor and Calculator modes, feedback, navigation, rule quiz.
- `js-cas/test/tutor-practice.test.mjs`: Step 0, typed next line, skip-ahead, adversarial notation and corpus coverage.
- `js-cas/test/browser-smoke.cjs`: actual offline Chrome checks for both distributions and no network requests.

Build using Node.js 22+ from `js-cas/` with `npm install`, `npm test`, `npm run build:offline`, `npm run test:browser` and `npm run test:render`. The built `offline/calculus-lab-single-file.html` can be opened without internet access.

## Next work

Improve domain tracking, precisely highlight changed terms, diagnose common misconceptions using math-backed rules, grade longer student-written solutions, and provide real rule-based integral and limit walkthroughs. Do not call unsupported solutions verified.
