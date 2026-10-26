# CAS for Tutoring — Math Dreamweaver Calculus Lab

An **offline-first, step-by-step Calculus I learning tool** built to show *why* a symbolic math result follows, not just display the answer.

![Desktop preview](docs/preview-desktop.png)

> **Project status:** Educational prototype (v1). The browser engine is intentionally limited, and the more capable desktop CAS does not explain every advanced symbolic transformation.

## Quick start — offline browser app

1. Download [`index.html`](index.html) to your computer (or clone this repository).
2. Open `index.html` in Chrome, Edge, Firefox, or Safari.
3. Choose **Differentiate**, **Integrate**, or **Simplify**, enter an expression, and select **Analyze problem**.
4. Reveal steps one at a time, request a hint, try the next derivative, inspect the graph, or export notes.

No installation, sign-in, network connection, remote math API, or web server is required. GitHub Pages hosting is **optional**; the same HTML file works locally without it.

**Try:** `(x^2+3)^4`, `sin(x^2)`, `(x^2+1)/(x+1)`, `3*x^2+2*x`, or `sqrt(x)`.

### What the browser edition does

- Traces power, product, quotient, chain, elementary trig, exponential, and logarithmic derivatives.
- Computes **selected elementary antiderivatives**; declines unsupported integration patterns rather than inventing a method.
- Offers hints, step navigation, derivative practice, local graphs, and downloadable study notes.
- Checks attempted derivatives with **numerical spot tests**, which are not a proof of symbolic equivalence.

## More powerful offline CAS (Python + SymPy)

The desktop edition can differentiate, integrate, solve equations, evaluate limits, simplify, expand, and factor, with instructional traces for implemented methods.

**One-time installation (while online unless dependencies are already installed):**

```bash
python -m pip install -r desktop/requirements.txt
```

**Run (online or offline):**

```bash
python desktop/calculus_lab_desktop.py
```

**Test the desktop CAS:**

```bash
python desktop/calculus_lab_desktop.py --self-test
```

Python 3.10+ and Tkinter are needed; SymPy is the only pip dependency. Some Linux distributions require `python3-tk`. Depending on your system, use `python3` or `py` instead of `python`.

The desktop app uses SymPy for the mathematical result. For advanced integrals or limits, a symbolic answer may be available *without* a complete annotated derivation. Those cases are labeled.

## Project structure

```text
index.html                 Standalone, offline-first web calculator
desktop/
  calculus_lab_desktop.py  SymPy-backed desktop tutor
  requirements.txt
developer/
  engine.js                Browser symbolic engine (maintainer source)
  ui.js                    Browser interface logic (maintainer source)
  test_engine.js           Developer test harness
  stress.js                Numerical regression tests
docs/
  SPEC.md                  Product and technical requirements
  specification.pdf        Printable spec sheet
  preview-desktop.png      App preview
README.md                  This guide
UPLOAD_INSTRUCTIONS.md     Publishing to this GitHub repository
.gitignore                 Local/private file exclusions
```

The browser deliverable in `index.html` embeds its CSS and JavaScript, so it does not load the files in `developer/` at runtime.

## For developers

With Node.js installed, check the browser math engine:

```bash
node developer/stress.js
```

See [`docs/SPEC.md`](docs/SPEC.md) for feature boundaries, acceptance tests, design choices, and roadmap. Tests cover representative cases, not all mathematics or domain-sensitive equivalence.

## Calculus I teaching references

- Silvanus P. Thompson, *Calculus Made Easy*: Chapters IV–VI (algebraic derivatives), IX (chain rule), XIV–XV (exponentials/trig), XVII–XX (integration/substitution).
- OpenStax, *Calculus Volume 1*: modern limits, derivatives, and integrals.

These are **study references**, not bundled copyrighted textbooks. Thompson is especially good for intuition; consult the modern course text for formal limit laws and proofs.

## Privacy and safety

The browser app runs completely locally with **no analytics, account, or network calls**; it does not automatically store a learning history. Study notes are exported only at the learner's request.

**This GitHub repository is public. Do not commit private study records, student-identifiable information, passwords, API tokens, or personal homework files.** Keep those locally. The included `.gitignore` helps prevent accidental commits but is not a substitute for checking `git status`.

## License

The project's existing [`LICENSE`](LICENSE) in the GitHub repository applies to the original source code. The repository-ready upload package deliberately does **not** replace that license.
