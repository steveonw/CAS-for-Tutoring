# CAS for Tutoring — Math Dreamweaver Calculus Lab

An **offline-first Calculus I tutoring project** combining deterministic symbolic mathematics with student-friendly explanations.

## Three ways to use the project

**1. Step-by-step browser tutor (zero installation):** Download [index.html](index.html), open it in a browser and work through supported elementary derivatives one rule at a time. No connection needed.

**2. JavaScript CAS (offline after a one-time build):** The [js-cas](js-cas/) edition uses **Nerdamer 2.0** for symbolic differentiation, integration, simplification, factoring, expansion, equation solving, and limits. Follow the [JavaScript setup instructions](js-cas/README.md) to build a self-contained *folder* that works offline. The GitHub Actions workflow also packages it as a downloadable artifact.

**3. Python/SymPy CAS:** The [desktop Python edition](desktop/calculus_lab_desktop.py) remains available for wider symbolic computation. Install Python, then `python -m pip install -r desktop/requirements.txt`, and run `python desktop/calculus_lab_desktop.py`.

## Why two engines?

Nerdamer works in the browser and can eliminate Python installation for routine offline use. SymPy remains useful for broad mathematics and cross-checking results. Both return **CAS-computed answers**, not necessarily a verified derivation. Our tutoring layer must explain actual transformations, not guess which steps the CAS took.

The zero-installation root [index.html](index.html) already explains selected differentiation rules but only supports limited syntax. The new `js-cas/` interface expands the operations supported *without falsely claiming to explain each step*.

## Repository map

- `index.html` — offline, elementary derivative explanation interface
- `js-cas/` — Nerdamer-powered browser CAS, build instructions, and tests
- `desktop/` — Python/SymPy command-line CAS
- `docs/SPEC.md` — product requirements and roadmap
- `docs/JS_CAS_LIBRARIES.md` — JavaScript library research and architecture choice
- `developer/` — earlier experimental test scripts; not automatically wired into the app
- `.github/workflows/javascript-cas.yml` — JS tests and offline-package build
- `LICENSE` — original MIT license (unchanged)

## Educational basis

Silvanus P. Thompson, *Calculus Made Easy*, especially chapters IV–VI and IX; OpenStax *Calculus Volume 1* for modern limits, continuity, and formal theorems.

## Roadmap

Build a real rule-by-rule transformation graph for product/quotient/chain rules, algebraic simplification, and integrals; add interactive hints and student attempts, visual graphs, practice-history export, and cross-engine correctness checks. Document unsupported cases explicitly.

## Privacy and licensing

Do not commit personal homework history, credentials, or student records to this public repository. Both browser editions run calculations locally; they make no network requests while being used offline. Project code is MIT; the bundled Nerdamer dependency is separately licensed Apache-2.0 and includes its license in generated offline packages.

## Status

Early educational prototypes. Check nontrivial answers by hand or with a second tool before using them for graded work.
