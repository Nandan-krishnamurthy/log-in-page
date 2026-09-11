# log-in-page

A simple, clean sign-in page, built as a learning exercise in operating an
**AI Software Factory** — a repeatable, station-by-station way of building
software. The workflow is the point. The login page is what it produces.

> **Status:** in progress. Phase B (logic) underway. See `docs/03-plan.md`.

## Running the page

> ⚠️ **Do not open `src/index.html` by double-clicking it.** The page will be
> blank. It uses ES modules, which browsers refuse to load over a `file://` URL,
> so it must be served over HTTP. This is a known and deliberate trade — see
> `docs/adr/0005-es-modules-and-local-server.md`.

```
python -m http.server 8000 --directory src
```

Then open <http://localhost:8000>. Any static server works; VS Code's Live Server
extension does the same job.

## Running the tests

```
npm test
```

Or `node --test` directly. There is nothing to install first — the project has no
dependencies, and `package.json` exists only to tell Node that `.js` files use ES
module syntax.

## Demo credentials

```
demo@example.com
password123
```

> **These are a stub, not a login.** The pair is hardcoded in plain text in
> `src/auth.js`, visible to anyone who opens the page. There is no server, no
> database, no password hashing and no session. Nothing is protected by this form
> and nothing should ever be placed behind it.

## The documents

The documents are the interesting part of this repository.

| File | What it is |
|---|---|
| `CLAUDE.md` | Working rules, git workflow, and definition of done |
| `docs/01-requirements.md` | Requirements R1–R13 with acceptance criteria and explicit non-goals |
| `docs/02-architecture.md` | Module layout, the dependency rule, submit flow, traceability |
| `docs/adr/` | Architecture decision records — what was chosen, and what was rejected |
| `docs/03-plan.md` | Thirteen tasks in four phases, each with a done-when condition |

## Structure

```
src/
  index.html      structure
  styles.css      presentation
  validation.js   format rules        — no DOM
  auth.js         the signIn seam     — no DOM
  ui.js           state and rendering — the only file that touches the DOM
tests/
  *.test.js       run under node --test, no dependencies
```

`validation.js` and `auth.js` never reference `document` or `window`. That rule is
what lets the logic be tested in Node with nothing installed — see
`docs/adr/0002-dom-free-logic-modules.md`.

## Tech

Plain HTML, CSS and vanilla JavaScript. No framework, no bundler, no build step,
no dependencies.
