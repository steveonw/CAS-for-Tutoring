# CAS for Tutoring — Math Dreamweaver Calculus Lab

An **offline-first Calculus I learning prototype** designed to show mathematical rules and the transformations used to solve problems.

## Start here

**Offline browser app:** Download [index.html](index.html) and open it in a modern browser. It requires no installation, sign-in, or internet connection.

Example inputs:
- `(x^2+3)^4`
- `sin(x^2)`
- `exp(3*x)`
- `ln(x^2+1)`
- `x^3+2*x`

Choose **Differentiate and explain** and reveal the steps one at a time. This initial version covers elementary derivatives and selected chain-rule cases only; it does **not** yet implement a complete symbolic algebra engine.

## More capable CAS

The Python edition uses SymPy for differentiation, integration, simplification, equation solving, factoring, and expansion. Run locally after installing Python and its dependency:

```bash
python -m pip install -r desktop/requirements.txt
python desktop/calculus_lab_desktop.py
```

It can calculate many more answers than the browser prototype, but it does not currently explain every symbolic transformation. **Only enter trusted local expressions** in the current desktop parser.

## Repository contents

- `index.html` — self-contained offline step-by-step derivative learning app
- `desktop/calculus_lab_desktop.py` — SymPy-powered interactive command-line CAS
- `desktop/requirements.txt` — Python dependency
- `docs/SPEC.md` — project specification, limitations and roadmap
- `developer/test_engine.js` and `developer/stress.js` — test scripts retained for the fuller engine; **not wired into this starter app**
- `.gitignore` — excludes common private/local development files
- `LICENSE` — pre-existing MIT license (preserved)

## Next improvements

Implement a complete parser/step trace engine, active practice, product and quotient differentiation, limits, integration explanations, graphs, automated tests and domain-aware validation.

## References

- Silvanus P. Thompson, *Calculus Made Easy*, chapters IV–VI and IX for differentiation rules.
- OpenStax, *Calculus Volume 1*, for contemporary limits, differentiation, and integration.

## Privacy

This public repository must not contain personal study data, credentials, or private coursework. The browser app makes no network requests and stores no learning history.

## Status

Educational starter release. Do not rely on this prototype as the sole verifier of homework answers.
