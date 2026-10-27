# v0.6 Design — Part-Aware Calculus Tutoring and Offline Math Input

**Status: PROPOSED, not implemented.** Product baseline: JavaScript Calculus Lab v0.5.1. Tracking issue: [#11](https://github.com/steveonw/CAS-for-Tutoring/issues/11). This design integrates the external AI's review with stricter mathematical acceptance criteria. Do not advertise these goals as shipped until implementation PRs and offline tests pass.

## Why this milestone

The existing tutor explains recorded CortexJS derivative transformations, accepts verified student shortcuts, recognizes several hard-coded wrong-answer patterns, and checks a subset of domain restrictions. What it does **not** yet do is reliably say "your *outer derivative* is right, but your *inner derivative* is wrong" while showing the actual subexpressions from the student's problem.

The primary interaction target:

- Problem: `f(x)=(3x^2+1)^5`
- Student: `5*(3*x^2+1)^4`
- Response: "You differentiated the outside correctly. Your inside function is `u=3x^2+1`. The chain rule needs `du/dx` as well." 
- If the student types `5*(3*x^2+1)^4*3*x`, say: "Outer derivative correct; the inside derivative does not match `du/dx=6x`." Do **not** call the inner derivative missing.
- If the student types `5*(3*x^2+1)^4*6*x` or `30*x*(3*x^2+1)^4`, accept it and let them review the optional intermediate steps.
- If the student enters the mathematically valid partial stage `5(3x^2+1)^4\frac{d}{dx}(3x^2+1)`, accept it as an intermediate transformation. Do not demand that every partial line already be numerically/equationally equal to the fully evaluated `f'` in a parser that cannot interpret `D`.

## Scope and order

### A. Component-aware derivative analyzer — build first

Add a module such as `js-cas/lib/derivative-parts.mjs`. Read the **original noncanonical expression tree**, not only the simplified Nerdamer result. Identify the outer and inner functions for composite power, trig, exponential and logarithmic derivatives; identify `u,v,u',v'` for products and quotients.

Suggested diagnostic contract (shape, not finalized API):

```js
{
  status: "partially-correct" | "correct" | "counterexample" | "inconclusive",
  rule: "chain",
  recognized: [
    { id: "outer", expressionLatex: "5(3x^2+1)^4", confidence: "symbolic" }
  ],
  missingOrIncorrect: { id: "inner", expressionLatex: "6x", kind: "missing" },
  evidence: { method: "symbolic-factors", counterexample: null },
  hints: [
    "Look inside the parentheses.",
    "Let u = 3x^2 + 1. What is du/dx?",
    "Using the chain rule, f' = 5(3x^2+1)^4(6x)."
  ]
}
```

Do **not** obtain part labels solely from dividing the candidate by an outer factor. A ratio becomes undefined at zeros and can conceal cancellations and new holes. Structural extraction, valid symbolic factoring, guarded numerical checks and explicit domain preservation may be combined, with an honest `inconclusive` fallback. Products need two additive contributions, not a single multiplicative-part heuristic. Distinguish an **unevaluated derivative operator** from an ordinary final-answer expression.

Keep `step-engine.mjs` the coordinator, `domain-guard.mjs` the partial source-domain inspector, and `practice-diagnostics.mjs` as the backwards-compatible rule-pattern fallback. Add a clear way for the renderer to show *which part* was identified.

### B. Three progressive hints — same diagnosis, different disclosure

Use one structured diagnosis to supply:

1. **Clue:** "Check the inside function." This should not immediately display the answer.
2. **Targeted prompt:** "For `u=3x^2+1`, what is `du/dx`?"
3. **Worked explanation:** "Apply `5u^4 \cdot u'` with `u'=6x`; the derivative is `30x(3x^2+1)^4`."

Hints should be monotonic, accessible by button or keyboard, and reset when the student enters a new problem or attempts a different step. Prior mistakes should not silently reveal later hints.

### C. Visual input editor — build first, in parallel with A

Integrate a locally pinned **MathLive** visual input field for the *student next-step* area, while retaining calculator-syntax and plain LaTeX alternatives. The visual editor should support fractions, powers, roots, trig functions and a supported derivative operator `d/dx`. Route editor output through a validated LaTeX adapter — do not create a new arbitrary-macro injection path.

**Offline constraints are strict:** MathLive's JavaScript, required fonts, optional sounds and license notice must be local. Build and test both the folder-based package and the existing **single-file HTML** package; the latter may need embedded font assets and must not leak network requests or break on `file://`. Measure single-file size and document the trade-off. Keyboard-only access, accessible labels, mobile behavior, and fallback text entry are acceptance requirements.

Vendor guidance: https://mathlive.io/mathlive/guides/integration/

### D. Regression tests are part of every change, not a future phase

Do not introduce a large nonblocking suite of `test.todo` cases just to produce a green CI. The acceptance matrix below must become **strict passing tests as each associated feature lands**. Preserve all existing 112 baseline tests and the offline Chrome/MathJax audits.

#### Required examples and failure controls

| Problem | Student input | Required result |
|---|---|---|
| `(3*x^2+1)^5` | `5*(3*x^2+1)^4` | Outer confirmed, inner missing; hint levels work |
| Same | `5*(3*x^2+1)^4*3*x` | Outer confirmed, inner **wrong**, not missing |
| Same | `5*(3*x^2+1)^4*6*x` | Accept and advance |
| Same | `30*x*(3*x^2+1)^4` | Accept and advance |
| Same | Partial valid derivative form with `d/dx` | Accept intermediate line |
| `sin(x^2)` | `cos(x^2)` | Outer correct, inner derivative missing |
| `e^(3*x)` | `e^(3*x)` | Inner derivative missing |
| `x*sin(x)` | `cos(x)` | Product rule wrong; identify *evidenced* component issue |
| `(x^2+1)/x` | Reversed quotient numerator | Identify sign/order error only with evidence |
| `x^2` | `2*x^2/x` | Reject newly introduced `x=0` hole |
| `(x^2-1)/(x-1)` | Simplified result at `x=1` | Preserve original source exclusion |
| Selected symbolic equality | Different algebraic factoring/order | Accept when supported |
| Deliberately wrong polynomial matching finite samples | Adversarial sample-point match | **Not** accepted as symbolic proof |
| Visual editor | `d/dx`, keyboard, fractions, roots | Valid LaTeX input and usable keyboard fallback |
| Both offline distributions | Open with `file://` in Chrome | Rendered formulas, no MathJax merror and **no HTTP requests** |

## Verification and student-facing language

Use a **three-tier decision policy**:

1. **Verified for supported cases**: exact recorded next state, rule-justified partial transformation or symbolic equivalence under recognized domain restrictions. The student may see **"Correct"**, with optional details available.
2. **Numerically consistent but not established**: domain-respecting samples agree while symbolic checking is inconclusive. The UI may say **"Looks correct at the points checked"**, without implying a proof or treating it as high-stakes verified credit.
3. **Counterexample / invalid / unsupported**: a valid input where expressions disagree, a detected new domain restriction, or inability to evaluate. Explain exactly what was observed; do not invent a misconception.

Why not mark every sampled match unconditionally correct? **WeBWorK does use domain- and tolerance-configured numeric comparison for some answer checkers**, which is pragmatic for low-stakes grading, but samples are not a general mathematical equivalence theorem. Math Dreamweaver should use sampling as strong *evidence* where appropriate, distinguish it from symbolic verification, and preserve important source-domain exclusions. References: https://webwork.maa.org/pod/pg/doc/MathObjectsAnswerCheckers.html and https://webwork.math.ucdavis.edu/wiki/doku.php?id=dealing_with_some_common_errors

## Out of scope and follow-on work

**Not in v0.6:** unrestricted formal proof grading; a complete domain/inequality solver; integration and limit step traces; or automatic storage of student history.

After v0.6, prioritize **integration before limits** because antiderivatives can be checked by differentiating (subject to domains and additive constants). For future adaptive practice, collect mistake *counts* only with **opt-in, on-device storage**, clear/export/delete controls, and no network; do not quietly begin logging students' work.

## Engineering and release gates

- Keep pinned dependencies with third-party license notices and fully reproducible offline builds.
- Preserve current Calculator Mode and Tutor Mode, with error messages only where supported.
- Pass `npm test`, `npm run build:offline`, `npm run test:browser`, and `npm run test:render` in GitHub Actions on the final branch head and after merging.
- Test both ordinary text input and MathLive, including cases where visual LaTeX contains derivative notation the calculator parser does not.
- Any performance/bundle-size increase must be measured. Do not silently replace the single-file distribution with a CDN-dependent version.

**This is a design specification only.** Follow [issue #11](https://github.com/steveonw/CAS-for-Tutoring/issues/11) for implementation work and verification.
