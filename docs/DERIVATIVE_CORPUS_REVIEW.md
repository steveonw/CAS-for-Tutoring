# 26-problem derivative regression and corrections

Original source: the user's supplied `derivative-corpus-tests.patch`.
As of **v0.3.1**, the test suite is REQUIRED (no TODO exceptions) and the
MathJax browser rendering audit is REQUIRED (no continue-on-error).
All changes are tracked in [PR #7](https://github.com/steveonw/CAS-for-Tutoring/pull/7).

## What was fixed

1. **Logarithms.** Nerdamer uses natural `log()`, while CortexJS would read
   serialized `\\mathrm{log}` as base 10. We normalize **Nerdamer-generated
   TeX only** to `\\ln` before parsing for step tracing or rendering. This
   also fixes `x^x` and `2^x` answer display. Numerical samples verify no
   detected counterexample in the regression corpus.
2. **Exponentials.** Add a local MathJax `\\exponentialE` macro rendering
   Euler's number upright. The render-check browser script now **fails CI**
   for a MathJax `merror`.
3. **Named rules.** CortexJS IDs for chain, exponential and general-power
   differentiation map to explicit teaching hints and rule quiz choices.
4. **Constant multiples.** Before/after MathJSON identifies when an actual
   numerical coefficient is moved outside differentiation. The student sees
   the *constant multiple rule* rather than a misleading product-rule label.
   The original CortexJS rule ID is retained for traceability.
5. **Extra safeguards.** Eliminate adjacent duplicate TeX steps; show the
   expression before and after each rule. A **detected numeric mismatch**
   with Nerdamer blocks the walkthrough and final answer. Matching sample
   values are never claimed to prove symbolic equality.

## Reproduce

Node 22+, then from `js-cas/`:

```bash
npm install
npm test
npm run build:offline
npm run test:browser
npm run test:render
npm run audit:rules
```

Browser tests need Google Chrome on CI or compatible installed Chromium
(see Playwright setup). `npm run traces -- 'sin(x^2)' 'x^x'` prints the
actual recorded transformations.

The 26 expressions cover standard powers, numerical coefficients, chain,
product, quotient, logarithmic, exponential, trig, inverse trig, root,
absolute value and variable-power cases. Some derivatives have restricted
real domains. The sample points in the corpus cover a **subset** of valid
positive real inputs, not all domains.

## Verification and limitations

The feature-branch CI at
https://github.com/steveonw/CAS-for-Tutoring/actions/runs/40422867230
recorded **76 passing tests; 0 failures; 0 TODO tests** and a successful
blocking MathJax render audit. Both offline folder and single HTML page
passed Chrome smoke testing.

A numeric counterexample can prove expressions differ. Agreement at
several sampled values **cannot prove** mathematical equivalence; algebraic
identities and excluded points still require domain-aware verification.

**Remaining teaching tasks:** Show Step 0 and quiz the first rule; enable
student-typed intermediate expressions; explain individual constant terms
removed by sum rules; avoid pedagogically unhelpful (but valid) expansions;
track and teach domains rigorously (e.g. `ln(x)` for `x>0`, derivative of
`abs(x)` undefined at zero); add full integral and limit walkthroughs;
expand the regression corpus with negative and boundary-domain tests.

This is a tested educational prototype, not a universal proof engine.
