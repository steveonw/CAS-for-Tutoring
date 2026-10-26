# Derivative corpus and collaborator review — October 26, 2026

Source: user-supplied `derivative-corpus-tests.patch` from a collaborator.
The tests are integrated as a reviewed adaptation, not an endorsement that
all derivative traces or explanations are correct.

## Run

From `js-cas/` with Node.js 22+ and dependencies installed:

```bash
npm install
npm test
npm run traces
npm run build:offline
npm run test:render
npm run test:browser
```

The first command needs internet to install dependencies. The built app is
offline. Render and browser tests require installed Google Chrome on the CI
runner (Ubuntu 24.04). `npm run traces -- "sin(x^2)" "x^x"` prints just
specific traces.

The corpus has **26 expressions** that exercise powers, constant multiples,
product, quotient, chain, trig, inverse trig, logarithms, exponentials, radicals,
absolute value, and an unusual variable exponent. Some have restricted domains.

### How to interpret results

- `npm test`: checks that traces are present and numerically compares final
  CortexJS/Nerdamer values at four *chosen valid samples*. A failure indicates
  a discrepancy or evaluator issue; a pass at samples **does not prove**
  mathematical equivalence or preserve domain restrictions.
- Several tests are deliberately marked **TODO** to document defects without
  breaking CI. A green `npm test` does **not** mean the TODO bugs are fixed.
- `npm run test:render`: browser-level MathJax error detection. It currently
  may fail on emitted `\\exponentialE` because MathJax has no corresponding
  macro. For that reason only, CI runs this audit with
  `continue-on-error: true`; never describe it as a passing requirement.
- `npm run test:browser`: existing offline UI regression tests; separately
  verifies the single-file and folder distributions.

### Reported bugs to address next

1. MathJax's missing `\\exponentialE` macro causes a red rendering error.
2. Nerdamer interprets `log` as natural logarithm while CortexJS may read
   `\\mathrm{log}` as base 10. Resolve semantics *before tracing*, and add
   numeric counterexample checks. Inconclusive symbolic equality is not success.
3. Map actual CortexJS chain, general power, exponential and other rule IDs to
   meaningful educational names. Ensure the quiz accepts chain rule.
4. Label numerical coefficients as **constant multiple**, not product rule.
5. After those, add Step 0, before/after displays, no-op simplification removal,
   typed next steps, known-mistake diagnostics, and domain explanations.

Some tests intentionally encode the **current** undesired behavior as TODO,
not a target. As code improves, turn fixed TODO tests into strict tests. Treat
the original collaborator's 26 cases as a start, not complete Calc I coverage.
