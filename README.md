# CAS for Tutoring — Math Dreamweaver Calculus Lab

An **offline-first Calculus I tutor** that separates correct symbolic calculation from the explanation of each mathematical rule.

## Choose a learning tool

**1. Step-by-step practice:** Open the [original single-file tutor](index.html) offline to review a small set of derivative rules. It needs no installation and does not require MathJax.

**2. JavaScript CAS + beautiful math:** The [JavaScript edition](js-cas/) combines **Nerdamer 2.0.0** with **MathJax 3.2.2** for LaTeX math display and optional limited LaTeX input. The offline package also includes an enhanced copy of the original practice tutor. Download the latest successful [Actions artifact](https://github.com/steveonw/CAS-for-Tutoring/actions/workflows/javascript-cas.yml) (named `math-dreamweaver-offline-js-cas-latex`), unzip it, and open `index.html`. No network, Python, or Node.js is needed to *use* the resulting offline package. For a single-file version, use `calculus-lab-single-file.html` from the same artifact.

**3. Python CAS:** The [SymPy desktop edition](desktop/calculus_lab_desktop.py) remains available for broader symbolic calculations. One-time setup: `python -m pip install -r desktop/requirements.txt`. Run `python desktop/calculus_lab_desktop.py`.

## What LaTeX adds

Input ordinary expressions such as `(x^2+3)^4` or a supported TeX formula such as `\\frac{x^3}{3}`. Nerdamer converts the expression, computes symbolically, and outputs LaTeX. A locally bundled MathJax turns that into readable textbook-style fractions, roots, integrals, derivatives, and limits. You can reveal and copy the raw answer LaTeX in the interface.

**Important:** Math rendering is not a solution derivation. The CAS edition provides math answers and named study prompts; the separate rule tutor supports step-by-step explanations for selected derivatives only.

## How to build offline from source

```sh
cd js-cas
npm install
npm test
npm run build:offline
```

Copy the complete `js-cas/offline/` folder to your offline computer and open its `index.html`. The build downloads dependencies **once** and vendors both JavaScript libraries and their license files into the distribution. See the [JavaScript edition README](js-cas/README.md) for details.

## Repository map

- `index.html` — dependency-free, limited derivative teaching prototype
- `js-cas/` — Nerdamer symbolic calculator, MathJax LaTeX renderer, offline packaging and tests
- `desktop/` — SymPy command-line CAS
- `docs/SPEC.md` — product architecture and roadmap
- `docs/LATEX_INTEGRATION.md` — MathJax/EquationWright design notes and accepted LaTeX commands
- `developer/` — earlier experimental test scripts (not automatically wired into current app)
- `.github/workflows/javascript-cas.yml` — tests and downloadable offline package
- `LICENSE` — original MIT license, untouched

## Learning references

- Silvanus P. Thompson, *Calculus Made Easy*, especially chapters IV–VI and IX.
- OpenStax, *Calculus Volume 1*, for modern derivative, limit, continuity and integral coverage.
- [EquationWright](https://github.com/steveonw/equationwright) for the pinned MathJax offline-distribution pattern; no EquationWright application code has been copied.

## Privacy, licenses and limitations

The browser CAS works locally and does not make network requests at runtime. Don't commit student records, private worksheets or credentials to this public repository. The project uses MIT licensing for its own code; packaged **Nerdamer and MathJax** are separately distributed under Apache-2.0 with preserved licenses. The CAS and TeX input conversion do not support all possible mathematical expressions or LaTeX commands; unsupported cases should fail visibly.

**Status:** Educational prototype. Verify nontrivial answers independently.
