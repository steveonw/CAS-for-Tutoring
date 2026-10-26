# JavaScript CAS prototype (Nerdamer)

This **optional JavaScript alternative to the Python/SymPy edition** uses [Nerdamer 2.0](https://nerdamer.com/) to compute symbolic results locally. The existing project-root `index.html` remains the separate offline step-by-step derivative prototype.

## What it supports

Differentiation, antiderivatives, simplification, expansion, factoring, solving for x, and elementary limits. Nerdamer may leave unsupported operations unevaluated, in which case the adapter explicitly reports failure. Computation is *not* the same as a verified handwritten step-by-step explanation.

## Install and run

Install Node.js 20 or newer. **One-time online setup:**

```sh
cd js-cas
npm install
npm test
npm run build:offline
```

Then open **`js-cas/offline/index.html`** in a browser, using the whole `offline/` folder. It works without an internet connection thereafter. You can zip/copy that folder onto an offline computer. It contains a packaged Nerdamer bundle, its Apache-2.0 license, and the app.

An automated GitHub Actions workflow builds a downloadable offline-folder artifact, so users can get it without installing Node.js themselves.

## Why Nerdamer?

The 2.0 release includes symbolic differentiation, integration, limits, and equation solving in one package. Unlike Math.js, it supports a broader set of calculus operations out of the box. Math.js is still worth considering later for educational expression trees and transparent transformations.

## Source files

- `lib/cas-adapter.js`: shared browser/Node module, input validation, CAS dispatch.
- `offline/index.html` + `offline/app.js`: local browser UI; scripts referenced by local paths.
- `scripts/build-offline.cjs`: copies the Nerdamer browser bundle and license into `offline/vendor/`.
- `test/cas.test.cjs`: basic automated functional checks.

## Educational integrity

Study prompts are **not** described as steps taken by Nerdamer. A future deterministic tutoring layer will explicitly trace transformations, explain each rule, and verify equivalence with the CAS. Integral results include the arbitrary constant `+ C` in the displayed answer.

## Licensing and privacy

This repository retains its MIT license. The separately packaged Nerdamer dependency is **Apache-2.0 licensed**; the build copies its original license, and no ownership of it is claimed. No remote services or telemetry are used at runtime. Calculations take place entirely in your browser.

## Limitations

Early integration, limits, non-elementary expressions and equations may be unsupported; do not trust an answer solely because it was returned by a CAS. Only x is supported in this first prototype. The first build requires Node/npm and internet access to fetch the dependency; the built app itself does not.
