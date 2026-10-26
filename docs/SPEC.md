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
