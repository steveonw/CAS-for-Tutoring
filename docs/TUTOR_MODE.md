# Tutor Mode — Step 0 and student-entered derivative steps

**Status:** Updated through offline JavaScript Calculus Lab v0.5.1 for supported derivatives. These checks are not a universal mathematical proof assistant.

## Two separate modes

**Tutor Mode** (default): enter `(x^2+3)^4` and select **Start guided practice**. Step 0 shows the original unsolved derivative. You can identify the **first rule**, ask for a hint, or write the next mathematical line before revealing the CortexJS transformation. Next/Previous, Why this rule?, Show all transformations, and Reveal final CAS answer remain available.

**Calculator Mode**: shows the Nerdamer result immediately. It does *not* claim to provide a complete derivation. Changing modes automatically resets the current lesson. For integrals, limits and other non-derivative operations, the calculator still provides the supported answer while stating that guided steps are unavailable.

## Writing a next step

Enter the proposed line in **Calculator syntax** (e.g. `2*x*cos(x^2)`) or select **LaTeX** for a TeX expression (e.g. `2x\cos(x^2)`). Some engine-generated intermediate steps include unevaluated derivative operators, but students do **not** have to reproduce them. A correct later state or full derivative earns credit and advances automatically. Calculator input is translated into TeX without Nerdamer first simplifying it, and domain guards inspect the original typed arithmetic.

The checker distinguishes:

- **Matched** — the line is exactly the recorded expression (including its source LaTeX), or parses to the same structured mathematical expression.
- **Equivalent** — CortexJS confirms symbolic equality to the next line under its assumptions. This is not certification of exactly the same method or all real domains.
- **Advanced** — your expression matches a later recorded state or final derivative, earns credit and advances. The skipped recorded steps remain available for review.
- **Counterexample** — the line and the next recorded expression produce different finite real values at a sample input. Such a discrepancy disproves identity at that point.
- **Unverified** — no established equivalence and no decisive counterexample. The answer is **not automatically marked incorrect**.
- **Invalid** — the restricted notation is unsupported or cannot be parsed.

**Mathematical caution:** Equal values at several test points do *not* prove that two expressions are identical everywhere. A symbolic simplifier also may not preserve input domains. The original domain, derivative existence, and the student's rule choice still matter.

## Worked examples

For `(x^2+3)^4`, Step 0 asks which rule to apply first. The first recorded rule is the **power rule** applied to a composite expression. The derivative of the inside, `2x`, appears in later steps. Entering the final result `8*x*(x^2+3)^3` immediately **earns credit** and advances to the last recorded step. Both the **power rule** and **chain rule** are accepted at Step 0 as defensible descriptions of the composite function.

For `sin(x^2)`, the **chain rule** is the first recorded transformation. Start by choosing that rule rather than seeing the answer.

For `log(x)`, this calculator consistently treats `log` as the **natural logarithm**. Be mindful of `x>0` in the real domain. For `abs(x)`, the derivative is undefined at `x=0`; the calculator still does not implement general formal domain tracking.

## Implementation and verification

- `js-cas/lib/step-engine.mjs`: `checkNextRule(trace,-1,...)` and `checkStudentStep(trace,index,latex)`.
- `js-cas/lib/domain-guard.mjs`: `calculatorToLatex()` renders validated calculator notation without asking Nerdamer to simplify it.
- `js-cas/offline/app.js`: Tutor and Calculator modes, feedback, navigation, rule quiz.
- `js-cas/test/tutor-practice.test.mjs` and `js-cas/test/student-real-world.test.mjs`: Step 0, realistic correct shortcuts, safe input and expanded mistake cases.
- `js-cas/test/browser-smoke.cjs`: actual offline Chrome checks for both distributions and no network requests.

Build using Node.js 22+ from `js-cas/` with `npm install`, `npm test`, `npm run build:offline`, `npm run test:browser` and `npm run test:render`. The built `offline/calculus-lab-single-file.html` can be opened without internet access.

## Next work

Improve domain tracking, precisely highlight changed terms, diagnose common misconceptions using math-backed rules, grade longer student-written solutions, and provide real rule-based integral and limit walkthroughs. Do not call unsupported solutions verified.

## v0.5.0 — Domain-aware next-step feedback

The checker now inspects a **limited set of real-domain conditions** in both the original problem and a submitted next step. These include nonzero denominators and negative-power bases; positive logarithm arguments; nonnegative square-root arguments; and possible differentiability issues at square-root/absolute-value zeros, inverse-trig boundaries, and trigonometric poles. Some checks are conservative boundary warnings, **not proof that every flagged boundary is a true nondifferentiability point**.

For calculator-notation input, the checker examines the **raw arithmetic before Nerdamer simplification**. This matters: for the derivative of `x^2`, `2*x^2/x` simplifies algebraically to `2*x` but is undefined at `x=0`. Because the original function and expected next step are defined at zero, the tutor reports **domain-mismatch** instead of silently accepting the cancelled expression. By contrast, a problem originally involving `(x^2-1)/(x-1)` retains its original exclusion at `x=1`, even if its derivative expression simplifies.

For certain common Calculus I errors, the engine constructs **specific incorrect patterns** and compares the actual submitted expression against them. A diagnosis also requires a finite real counterexample against the correct final derivative **at a point allowed by the original function's recognized domain**. Supported patterns include omitting the chain rule's inner derivative; retaining only one product-rule contribution; replacing the quotient-rule subtraction with addition; losing a numerical coefficient; and retaining a constant that should differentiate to zero. If the evidence is missing, feedback stays **unverified** or reports a generic counterexample rather than assigning a guessed mistake.

This remains a **partial structural scanner**. It does not solve arbitrary inequalities, detect all removable singularities, prove equality of real domains, or grade an unrestricted handwritten proof. The UI labels detected restrictions and uncertainties rather than claiming complete verification.

Tests: `js-cas/test/domain-diagnostics.test.mjs` covers these recognized cases and negative controls. `js-cas/test/browser-smoke.cjs` checks that the offline interface displays domain notes and specific feedback for real student entries.

## v0.5.1 — Real student answers receive credit

The CortexJS steps are **examples**, not mandatory handwriting. If the checker establishes a match to a later recorded expression or final derivative, the answer earns credit and the UI advances to that step. The student can navigate back to review earlier steps. Algebraic equality is still subject to the engine's assumptions and recognized domain restrictions; sample points never prove a complete identity.

The `calculatorToLatex()` formatter in `lib/domain-guard.mjs` turns restricted calculator syntax into TeX without passing the typed expression through Nerdamer's simplifying serializer. The mathematical comparison can subsequently canonicalize expressions while the raw original arithmetic remains available for domain checks. This preserves student entry such as `4*(x^2+3)^3*2*x` and grants credit for the completed chain rule on `(x^2+3)^4`.

For composite expressions including `(x^2+3)^4`, `cos(x)^2`, and `e^(3*x)`, the first-rule quiz also accepts **chain rule** even when CortexJS records the power or exponential rule first. It does not accept chain as a separate initial rule for ordinary `x^5`.

Expanded mistake patterns cover multiplying f′g′ in place of the product rule, reversing a quotient-rule numerator's subtraction order, failing to lower a power's exponent, and missing the inner derivative for `e^(3*x)`. These patterns still need both a matching symbolic wrong expression and a counterexample within a recognized valid original domain.

Technical caveats are now under **About these checks and their limitations**. The domain-notes box appears only when a recognizable restriction exists. This is a human-centered Calculus I aid, not a general proof checker.

## v0.6.0-alpha.1 — Recognize correct parts and reveal hints gradually

For supported chain-rule problems such as `(3*x^2+1)^5`, the tutor compares a student's **unsimplified outside factors** to the verified derivative decomposition. Enter `5*(3*x^2+1)^4`: it identifies the *outside derivative* as correct, shows the actual inside function, and explains that its derivative is missing. Enter `5*(3*x^2+1)^4*3*x`: it reports that the **inside factor is incorrect**, not missing. Enter `5*(3*x^2+1)^4*6*x` or `30*x*(3*x^2+1)^4`: the calculator credits the correct complete derivative as before.

**Show next hint** progresses through three levels: (1) short clue, (2) focused question about the typeset inner function, and (3) full worked line. Levels 1 and 2 do not display the worked answer; the third does. A new input attempt or problem resets the hints. Supported LaTeX `\frac{d}{dx}` expressions can still be accepted as *partially evaluated* correct steps.

This implementation does **not** infer what is correct merely by dividing two formulas. It requires a verified source-derived chain decomposition, structural factor evidence and a counterexample where the original recognized real domain permits the input. Unsupported structures fall back to earlier pattern checks and honest noncommittal feedback. The domain inspector remains partial, not a general theorem prover. In this **alpha** release, student input is still a text field. The offline visual MathLive editor from [issue #11](https://github.com/steveonw/CAS-for-Tutoring/issues/11) remains to be built.

## v0.6.0-alpha.2 — Visual math editor, still completely offline

The student step field now defaults to **Visual equation editor**, built with locally pinned MathLive 0.111.1. Enter fractions, exponents, square roots, sine/cosine functions and derivative notation with a physical keyboard, the editor's math keyboard, or the small insertion toolbar (including `d/dx`). On a supported derivative problem, your mathematical line is passed into the **same validated LaTeX step checker** as before. You can switch **My input notation** to **Calculator syntax** or **LaTeX notation** at any time. A supported partial derivative such as `5(3x^2+1)^4\frac{d}{dx}(3x^2+1)` receives credit as an intermediate stage; completed equivalent derivatives also receive credit.

The MathLive editor is for the **student's next step** in Tutor Mode; it does not yet replace the main problem-input box or add guided traces for integrals/limits. The mathfield is a client-side editable web component, and its exported LaTeX must still satisfy the tutor's restricted command allowlist. An incomplete placeholder or an unsupported LaTeX command can return an **invalid** result; this is a validation boundary, not an unsafe parsing bypass. Use the text fallback if preferred.

### Offline font packaging

`npm run build:offline` copies MathLive's script, `mathlive-fonts.css`, the font assets and the MIT license into `offline/vendor/`. The **folder** build references those local assets. In the **single-file** build, the trusted font CSS is converted to base64 font data URLs, the trusted minified MathLive script is embedded, and the license appears in a readable HTML template. No CDN, analytics, login or network dependency is needed to use either version.

The built standalone HTML file grew from 8,953,423 bytes to 10,433,139 bytes (**+1,479,716 bytes**, around 1.48 MB); it trades a modest file-size increase for fully offline visual editing. The `file://` Chrome regression asserts the editor exists, real typed and editor-entered derivatives are graded, local fonts are registered, and neither build makes HTTP requests. Run `npm test && npm run build:offline && npm run test:browser && npm run test:render` before changing the math editor.
