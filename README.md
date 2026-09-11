# log-in-page

A simple, clean sign-in page, built as a learning exercise in operating an
**AI Software Factory** — a repeatable, station-by-station way of building
software. The workflow is the point. The login page is what it produces.

> **Status:** complete. All thirteen planned tasks are done, and 57 of 58
> acceptance criteria are verified — the 58th cannot be observed in this version.
> See `docs/04-verification.md`.

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

Or `node --test` directly. 45 tests cover the validation rules and the sign-in
check. There is nothing to install first — the project has no dependencies, and
`package.json` exists only to tell Node that `.js` files use ES module syntax.

`src/ui.js` has no automated tests by design: it is the one file allowed to touch
the page, and Node has no page to touch. It is verified by hand, using the
checklist at the end of `docs/04-verification.md`. Repeat that checklist after any
change to `src/`.

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
| `docs/adr/` | Five architecture decision records — what was chosen, and what was rejected |
| `docs/03-plan.md` | Thirteen tasks in four phases, each with a done-when condition |
| `docs/04-verification.md` | Every acceptance criterion, its result, and what kind of evidence backs it |

Every document carries its own amendments. Where a later station found an
earlier one wrong, the correction is recorded with the reason, not silently
applied.

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

## How this was built

Each stage produced a document, and each document was approved before the next
stage began.

| Stage | Output |
|---|---|
| Requirements | `docs/01-requirements.md` — what, and how to tell it is done |
| Architecture | `docs/02-architecture.md` and five ADRs — the shape, and why |
| Planning | `docs/03-plan.md` — thirteen tasks, each with a done-when condition |
| Build | One task at a time, each reviewed before it was committed |
| Verification | `docs/04-verification.md` — every criterion, with its evidence |

The code reached `main` through four pull requests, one per phase, merged with
merge commits so that every task survives as its own commit. Every commit message
names the task and the requirement it serves.

**What the process caught** — each found by a later stage checking an earlier one,
not by anyone being clever:

- **A plan that could not pass.** T1's done-when required a test run with no test
  files, which Node treats as failure. Found by writing out the commands before
  running them.
- **A requirement with a hole in it.** The first email rule accepted `a b@c.com`.
  The code matched the requirement; the requirement was wrong. Found by running
  the finished code against real inputs.
- **Design state that nothing used.** A `submitted` flag in the architecture turned
  out to duplicate what the error state already knew. Found while implementing it.
- **A tripwire nobody looked at.** The plan's size limit on `ui.js` went unchecked
  for two tasks. It is now part of the definition of done in `CLAUDE.md`.
- **Two criteria failing since T6.** The "Forgot password?" link changed the URL,
  and it was too small to tap reliably. Found by the final verification sweep.
- **A published number that was wrong.** A contrast ratio worked out by hand was
  off by 0.8. Found when it was measured by script.

## Known limitations

- **The generic failure message has never been seen on screen.** Nothing in this
  version can trigger it. Its behaviour is established by reading the code only.
- **No backend.** The sign-in check is the hardcoded stub above.
- **The two credential messages reveal which email addresses have accounts.**
  Separate "Incorrect email" and "Incorrect password" messages were chosen
  knowingly for this version, which has one fake account. Before any real user
  data sits behind a login, this must be revisited — see R7 in
  `docs/01-requirements.md`.
- **The email rule is deliberately simple** and will reject some technically
  valid addresses.
- **The page must be served over HTTP** — see "Running the page".
- **`src/ui.js` is verified by hand**, not by tests.
- **The rule that `validation.js` and `auth.js` never touch the page** is checked
  by searching the source, not enforced by a test.

## Next

A real backend is planned as a separate learning project, run through the same
stages again. The client side is already shaped for it: every sign-in goes through
one `async` function, so connecting a server means rewriting that function and
nothing else — see `docs/adr/0003-async-signin-seam.md`. Whether that prediction
holds is the backend project's first real test.

## Tech

Plain HTML, CSS and vanilla JavaScript. No framework, no bundler, no build step,
no dependencies.
