# ADR-0005 — ES modules, served over HTTP

**Status:** Accepted
**Date:** 2026-09-10

## Context

ADR-0002 requires that the same `validation.js` and `auth.js` files be loaded by
both the browser and `node --test`. That forces a choice of module format.

ES modules (`import` / `export`) are the modern standard and are understood by
both. But browsers refuse to load them from a `file://` URL: opening
`src/index.html` by double-clicking it produces a CORS error and a blank page.
Modules must be served over HTTP.

Node, separately, treats a `.js` file as CommonJS unless told otherwise, so
`export` in a `.js` file fails under `node --test` without a signal.

## Decision

Use ES modules throughout. Add a `package.json` containing `{ "type": "module" }`
and nothing else — no dependencies, no scripts that install anything.

Serve the page locally during development:

```
python -m http.server 8000 --directory src
```

Both Python 3.12.6 and Node v24.12.0 were confirmed present on this machine
before this decision was made.

## Consequences

- One set of source files works in the browser and under test, with no build step
  and no duplication.
- The page cannot be opened by double-clicking the HTML file. This is a real
  papercut and must be written in the README, or the next person will conclude
  the page is broken.
- A `package.json` exists in a project that has no packages. It is a two-line
  declaration, not a dependency manifest, and `node_modules/` is gitignored
  against accidents.
- Any static server works — VS Code's Live Server extension is equivalent and may
  be more convenient inside the editor.

## Alternatives considered

- **Classic `<script>` tags with global variables**, avoiding the server
  entirely. Rejected: Node cannot import globals, so the logic would have to be
  duplicated or wrapped in a compatibility shim to stay testable, defeating
  ADR-0002.
- **Naming the files `.mjs`** to satisfy Node without a `package.json`. Rejected:
  `python -m http.server` does not reliably serve `.mjs` with a JavaScript MIME
  type, so the browser refuses the module — trading a clear problem for an
  obscure one.
