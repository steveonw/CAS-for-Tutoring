# Math Dreamweaver — Calculus Lab specification

## Goal
Teach introductory calculus through visible symbolic transformations, named rules, and active learner participation—not just show a final answer.

## Current editions
- `index.html`: a self-contained offline browser prototype, focused on elementary derivatives and chain-rule walkthroughs. No internet needed.
- `desktop/calculus_lab_desktop.py`: a local SymPy-based calculator supporting derivatives, antiderivatives, simplification, factoring, expansion, and algebraic equation solving. Install SymPy before going offline.
- `desktop/requirements.txt`: minimal dependency list.
- `developer/`: regression test scripts and planned engine modules.

## Product requirements
1. Parse math expressions with constrained syntax.
2. Compute symbolic results deterministically.
3. Associate each supported transformation with a rule, mathematical expression, and rationale.
4. Show one step at a time with clear 'previous' and 'next' navigation.
5. Avoid fabricated explanations: unsupported transformations must be labeled.
6. Keep calculations fully local, with no remote telemetry or account requirement.
7. Make it possible to ask 'why?', practice the next step, visualize functions, and export notes in future versions.

## Educational alignment
Silvanus P. Thompson's *Calculus Made Easy*: power and constant rules (chapters IV–V), sums/products/quotients (VI), and chain rule (IX). Use OpenStax Calculus Volume 1 for formal modern limits, continuity, and theorem statements.

## Known limitations
The embedded HTML walkthrough does **not** currently cover every function type, symbolic simplification, domain restriction, arbitrary products, quotients, or integration. The desktop CAS computes a wider set of answers but does not trace all steps. SymPy parsing is designed for trusted local input only.

## Roadmap
- Improve expression parser and symbolic step tree.
- Add correct product, quotient, and implicit differentiation explanations.
- Build integration rule tracing, hint mode, mistakes diagnostics, and exercises.
- Implement domain-aware equality checking and formal limit procedures.
- Add a richer learning interface, accessibility QA, and fuller automated tests.

## Acceptance criteria
- Fully offline execution after dependencies are installed.
- Reference equations produce mathematically correct results.
- Explanations identify only rules actually applied.
- Existing repository license remains unchanged.
- Unsupported inputs fail explicitly and never masquerade as solutions.


## LaTeX / MathJax integration (implemented in js-cas)

The JavaScript offline distribution pins Nerdamer 2.0.0 and MathJax 3.2.2. After a one-time npm install, \`npm run build:offline\` produces an entirely local browser folder with the two dependencies, licenses, a CAS interface, and an enhanced step tutor.

Nerdamer handles symbolic operations and TeX conversion (\`convertFromLaTeX\`, \`toTeX\`). MathJax handles only presentation; it does not alter mathematical answers. The user can input basic LaTeX, view equations rendered via SVG, and copy answer LaTeX. Unsupported macros and formulas are rejected or visibly fall back to plain CAS output.

This architecture follows EquationWright v7.3's independently pinned, self-contained MathJax offline-rendering approach. See \`docs/LATEX_INTEGRATION.md\` for source evidence, accepted commands, security and third-party notices. The project-root \`index.html\` remains standalone and dependency-free.

**Unfinished:** A verified derivation graph, full MathLive-style visual editor, and comprehensive limit/integration teaching. These require separate reasoning and test coverage.

## Guided CortexJS derivatives (implemented in JavaScript edition)

The offline JavaScript calculator now loads a locally packaged CortexJS Compute Engine 0.159.0 bundle. For supported differentiation problems, `lib/step-engine.mjs` calls the real `expression.explain('D',{variable:'x'})` API. Each recorded step contains a rule ID, description, intermediate LaTeX and selected Thompson textbook guidance. The UI has previous/next step, a rule-prediction mini-quiz, hints, why/reason text, show-all and hidden final answer. Nerdamer's derivative is retained as an independent CAS comparison where CortexJS can confirm equality.

The result of the rule-prediction quiz only indicates whether the student correctly identified the **next rule**, not whether an arbitrary intermediate expression is mathematically correct. Unsupported inputs and all other operations fail back to the original CAS without invented steps. Current packaging supports both a complete offline folder and a single-file `calculus-lab-single-file.html` edition. The original root derivative tutor and Python CAS remain unchanged.

Future: structured student step entry, rigorous domain-aware equality validation, limit explanations, Rubi integration traces with readable rule names, and broader textbook regression coverage. See `docs/JS_STEP_TUTOR_RESEARCH_2026-10-26.md`.

## Tutor Mode and Step 0 (v0.4.0)

The JavaScript edition separates quick Calculator Mode (direct Nerdamer answer) and Tutor Mode (CortexJS-recorded derivative steps). The latter begins with an unsolved Step 0, checks the first rule, and allows students to enter a proposed next expression. Accepted results are narrowly labeled: exact trace match, proven symbolic equivalence under engine assumptions, skipped intermediate work, numeric counterexample, invalid input or unverified expression. Numerical sampling never proves functional identity or complete real-domain equivalence. The tutor offers no fictional working for integrals, limits and other operations. See `docs/TUTOR_MODE.md`.

## v0.5.0 limited domain and misconception checks

The JavaScript checker retains the student's unsimplified calculator notation and the original expression. Known denominator/logarithm/radical restrictions and selected trig boundaries feed into a partial domain review. A candidate newly undefined at a sample/boundary where the source and next recorded line remain allowed is labeled `domain-mismatch` (example: `2*x^2/x` versus `2*x` at zero for an `x^2` problem). Confidence is limited: arbitrary domains and generalized inequalities remain unsolved. Misconception feedback requires a concrete match to constructed known error patterns and a demonstrable difference from the correct derivative on the original recognized real domain. Tests prevent guessing from numerical resemblance. Docs: `docs/TUTOR_MODE.md`.

## v0.5.1 — Fair progress checks and first-rule flexibility

Supported symbolic later steps and complete derivatives now earn credit and advance in Tutor Mode. CortexJS's partially evaluated derivatives are optional examples, not mandatory student notation. A raw calculator-to-LaTeX conversion preserves typed grouping before canonical comparison. Chain is accepted alongside the engine's power/exponential first-rule label for appropriate composite functions. Added evidenced mistake patterns include multiplied product derivatives, reversed quotient subtraction, and unchanged power exponents. UI warnings are collapsible and domain notes conditional. Limit/integration traces and general domain-aware proof checking remain unfinished.

## v0.6.0-alpha.1 — Source-AST derivative parts and three-tier hints

Implemented phase 1 of issue #11. `js-cas/lib/derivative-parts.mjs` provides a supported chain-rule decomposition for composite power, trig, exponentials, logs and square roots. It identifies an outside derivative as correct only when the submitted factorization matches its verified symbolic outer expression and a wrong final derivative is witnessed on the recognized original domain. The tutor distinguishes missing and incorrect inner factors, typesets outer/inner parts, and reveals three progressive hints with a worked formula only in the final tier. Existing correct full and partially evaluated student work remains accepted. Strict Node and offline browser regression tests ship with the feature. **Not yet implemented:** fully offline MathLive visual input, arbitrary student-method verification and general product/quotient part decomposition.
