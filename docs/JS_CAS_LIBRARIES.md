# JavaScript CAS libraries considered (October 2026)

The original starter includes a Python/SymPy command-line CAS plus a lightweight, dependency-free derivative tutor in `index.html`. We evaluated browser-first symbolic engines as an easier offline option.

| Library | Differentiation | Integration | Algebra & solving | Teaching-step support | License |
|---|---|---|---|---|---|
| Nerdamer 2.0 | Yes | Yes, supported forms | Yes | External explanation layer needed | Apache-2.0 |
| Math.js | Yes | Not provided as a general built-in symbolic integration function | Simplification and expression trees | Excellent parsed tree and unsimplified derivative access; not full tutorial | Apache-2.0 |
| Algebrite 1.4 | Yes | Yes | Yes | External explanation layer needed | MIT |
| CortexJS Compute Engine | Symbolic mathematical expressions and rich MathJSON/LaTeX interchange | Check exact release capabilities before promising an integration algorithm | Symbolic and numeric operations | Strong representation foundation | MIT |

Sources:
- https://nerdamer.com/docs/getting-started/
- https://nerdamer.com/docs/reference/diff/
- https://nerdamer.com/docs/reference/integrate/
- https://nerdamer.com/docs/reference/solve/
- https://mathjs.org/docs/reference/functions/derivative.html
- https://mathjs.org/docs/expressions/expression_trees.html
- https://www.npmjs.com/package/algebrite
- https://cortexjs.io/compute-engine/

## Decision

Use **Nerdamer 2.0.0** in the first JavaScript CAS experiment for breadth of Calc I operations and documented browser distribution. Run `npm install` once, then `npm run build:offline` to copy the actual compiled bundle into a local `offline/` folder. Never depend on a CDN at runtime. Pin the direct dependency and run regression tests. Keep the root HTML tutor and SymPy edition unchanged for comparison.

The JS adapter is deliberately explicit that it returns a CAS result and **study prompts, not authenticated step-by-step intermediate calculations**. A later tutoring layer will trace rule applications using a mathematical expression tree, check intermediate equivalence with the CAS, and expose uncertainty and unsupported cases.

## Risks

- Nerdamer 2.0 is a relatively recent major rewrite; its public APIs differ from 1.x examples. Use 2.x documentation.
- Not all integrals/limits solve symbolically. Unevaluated expressions should be reported, not fabricated.
- Domain assumptions matter: two expressions can be algebraically equivalent on an allowed domain but differ at excluded points.
- CAS engines can produce correct final answers without exposing human-intelligible derivations; we need a dedicated transformation recorder.
- Package redistribution requires preserving Nerdamer's Apache-2.0 license and notices.
