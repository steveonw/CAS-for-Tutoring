# CAS for Tutoring — Math Dreamweaver Calculus Lab

An **offline-first Calculus I tutor** that separates correct symbolic calculation from the explanation of each mathematical rule.

**Continuing this project with another AI?** Read the [AI handoff and verified project snapshot](AI_HANDOFF.md) first. It covers the current architecture, working tests, offline build instructions, unfinished features and a ready-to-paste continuation prompt.

## Choose a learning tool

**1. Step-by-step practice:** Open the [original single-file tutor](index.html) offline to review a small set of derivative rules. It needs no installation and does not require MathJax.

**2. JavaScript CAS + real guided steps:** The [JavaScript edition](js-cas/) combines **CortexJS Compute Engine 0.159.0** for recorded derivative steps, **Nerdamer 2.0.0** for a symbolic answer, and **MathJax 3.2.2** for beautiful LaTeX math, with optional limited LaTeX input. The offline package also includes an enhanced copy of the original practice tutor. Download the latest successful [Actions artifact](https://github.com/steveonw/CAS-for-Tutoring/actions/workflows/javascript-cas.yml) (named `math-dreamweaver-calculus-lab-guided-steps`), unzip it, and open `index.html`. No network, Python, or Node.js is needed to *use* the resulting offline package. For a single-file version, use `calculus-lab-single-file.html` from the same artifact.

**3. Python CAS:** The [SymPy desktop edition](desktop/calculus_lab_desktop.py) remains available for broader symbolic calculations. One-time setup: `python -m pip install -r desktop/requirements.txt`. Run `python desktop/calculus_lab_desktop.py`.

## What LaTeX adds

Input ordinary expressions such as `(x^2+3)^4` or a supported TeX formula such as `\\frac{x^3}{3}`. Nerdamer converts the expression, computes symbolically, and outputs LaTeX. A locally bundled MathJax turns that into readable textbook-style fractions, roots, integrals, derivatives, and limits. You can reveal and copy the raw answer LaTeX in the interface.

**v0.5.0:** Tutor Mode now detects selected *domain differences* and *common derivative mistake patterns* without pretending that sample values prove equivalence. For example, it flags `2*x^2/x` at `x=0` when used as the next line for the derivative of `x^2`, and it can explain a missing inner derivative in `sin(x^2)`. **Now included:** Choose **Tutor Mode** (Step 0: recognize the first rule, write a next expression, reveal steps) or **Calculator Mode** (immediate symbolic answer). The CAS edition shows actual intermediate derivative transformations for supported problems. The v0.3.1 correctness pass fixes the natural-log mismatch, chain and constant-multiple labels, and MathJax exponential notation; cross-engine conflicts now block misleading walkthroughs. Reveal steps one at a time, ask why, predict the next rule, request hints, or show all. The answer stays hidden until requested in Tutor Mode. Its typed-step checker distinguishes an exact recorded step, an engine-confirmed equivalent form, a skipped intermediate step, a numeric counterexample and unverified work. This is not a full mathematical proof checker. Integration, limits, and other operations do **not yet** have the same verified step-by-step interface.

## How to build offline from source

```sh
cd js-cas
npm install
npm test
npm run build:offline
```

Copy the complete `js-cas/offline/` folder to your offline computer and open its `index.html`. The build downloads dependencies **once** and vendors all three JavaScript libraries and their license files into the distribution. See the [JavaScript edition README](js-cas/README.md) for details.

## Repository map

- `index.html` — dependency-free, limited derivative teaching prototype
- `js-cas/` — Nerdamer CAS, CortexJS recorded derivative walkthroughs, MathJax renderer, offline packaging and tests
- `desktop/` — SymPy command-line CAS
- `docs/SPEC.md` — product architecture and roadmap
- `docs/LATEX_INTEGRATION.md` — MathJax/EquationWright design notes and accepted LaTeX commands
- `docs/TUTOR_MODE.md` — Step 0, next-step entry, grader boundaries and usage
- `developer/` — earlier experimental test scripts (not automatically wired into current app)
- `.github/workflows/javascript-cas.yml` — tests and downloadable offline package
- `LICENSE` — original MIT license, untouched

## Learning references

- Silvanus P. Thompson, *Calculus Made Easy*, especially chapters IV–VI and IX.
- OpenStax, *Calculus Volume 1*, for modern derivative, limit, continuity and integral coverage.
- [EquationWright](https://github.com/steveonw/equationwright) for the pinned MathJax offline-distribution pattern; no EquationWright application code has been copied.

## Privacy, licenses and limitations

The browser CAS works locally and does not make network requests at runtime. Don't commit student records, private worksheets or credentials to this public repository. The project uses MIT licensing for its own code; packaged **Nerdamer, MathJax and CortexJS** retain their original third-party licenses in the distribution. The CAS and TeX input conversion do not support all possible mathematical expressions or LaTeX commands; unsupported cases should fail visibly.

**Status:** Educational prototype. Verify nontrivial answers independently.
