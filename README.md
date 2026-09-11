# log-in-page

A simple, clean sign-in page — built as a worked example of an **AI Software
Factory**: a repeatable, station-by-station way of building software, where an AI
agent does the drafting and the implementation, and a human approves every step
before the next one begins.

The login page is the product. **The process is the point.** Every requirement,
design decision, task, correction and verification result is written down in this
repository, so you can follow not just what was built but how, and where the
process caught its own mistakes.

The AI agent throughout was [Claude Code](https://claude.com/claude-code). The
human reviewer made every decision and inspected every change.

> **Status: complete.** All thirteen planned tasks are done, delivered across four
> phases and four pull requests. What was verified, how it was verified, and what
> could not be verified are recorded criterion by criterion in
> [`docs/04-verification.md`](docs/04-verification.md).

> ⚠️ **This is not real authentication.** It is a front-end learning project with
> one hardcoded demo account, visible to anyone who reads the source. There is no
> server, no database, no password hashing and no session. Do not put anything
> behind it.

---

## Quick start

### Run the page

You need Python 3, or any other static file server.

```
python -m http.server 8000 --directory src
```

Then open <http://localhost:8000>.

> **Do not open `src/index.html` by double-clicking it** — the page will be blank.
> It uses ES modules, which browsers refuse to load from a `file://` URL, so it has
> to be served over HTTP. This is a deliberate trade, recorded in
> [ADR-0005](docs/adr/0005-es-modules-and-local-server.md). VS Code's Live Server
> extension works just as well.

### Run the tests

You need Node.js. The project was developed on v24; any recent version with the
built-in test runner will do.

```
npm test
```

That runs `node --test`: **45 tests** covering the validation rules and the
sign-in check. There is nothing to install first — the project has no
dependencies at all. `package.json` exists only to tell Node that `.js` files use
ES module syntax, and to define the `test` script.

### Sign in

```
demo@example.com
password123
```

This is the only account. Any other well-formed address is rejected with
**"Incorrect email"**, which means *there is no account with this address* — not
that the address is badly formed. A badly formed address gets **"Enter a valid
email address"** instead. The two messages come from two separate checks.

---

## What was built

A single sign-in card with:

- email and password fields, with a **Show/Hide** toggle for the password
- a **"Forgot password?"** link, deliberately a placeholder that goes nowhere
- **inline validation**: quiet until the first submit, then live for any field
  showing an error
- a **credential check** that reports "Incorrect email" or "Incorrect password"
  under the field concerned
- a **pending state** while signing in — button disabled, fields read-only, no
  double submit
- a **signed-in panel** with a Sign out button that returns the card to its
  first-visit state

It was built to explicit accessibility and layout targets: fully usable by
keyboard, a visible focus ring on every control, WCAG AA contrast measured for
every colour pair the page draws, 44px tap targets, and usable from 320px wide to
full desktop.

The full list — thirteen requirements with their acceptance criteria and explicit
non-goals — is in [`docs/01-requirements.md`](docs/01-requirements.md).

---

## Architecture

```
src/
  index.html      structure only
  styles.css      presentation
  validation.js   format rules          — never touches the page
  auth.js         the signIn() seam     — never touches the page
  ui.js           state and rendering   — the only file that touches the page
tests/
  validation.test.js
  auth.test.js    run under node --test, nothing installed
docs/             the factory's documents — see below
CLAUDE.md         the working rules the AI agent follows in this repository
package.json      declares ES modules and the test script; no dependencies
```

Five decisions shape the code. Each has an Architecture Decision Record (ADR)
saying what was chosen, what it costs, and what was rejected:

| ADR | Decision |
|---|---|
| [0001](docs/adr/0001-no-framework-no-build-step.md) | Plain HTML, CSS and JavaScript — no framework, no build step, no dependencies |
| [0002](docs/adr/0002-dom-free-logic-modules.md) | `validation.js` and `auth.js` never touch the page, so they can be tested in Node with nothing installed |
| [0003](docs/adr/0003-async-signin-seam.md) | Every sign-in goes through one `async signIn()` function, ready for a real server later |
| [0004](docs/adr/0004-state-and-render-loop.md) | One state object and one `render()` function make the page match it — **amended after the final review** |
| [0005](docs/adr/0005-es-modules-and-local-server.md) | ES modules, served over HTTP |

**How `ui.js` works.** Events change a single state object; `render()` makes the
page match it; handlers never change the page directly. Because `render()` sets
everything it controls on every call, the page cannot drift into a combination
nobody designed — a spinner beside a cleared error, or a button disabled forever.

**What the amendment changed.** The state object holds what the *page* decides:
errors, the pending flag, whether the password is visible, the signed-in session.
It deliberately does **not** hold what is typed into the fields. Those values
belong to the browser — typing, autofill, password managers and form restoration
all write them — so `render()` never writes into an input, and code reads the
fields directly when it needs them. The one exception is Sign out, which clears the
fields with the form's own `reset()`. Why this changed is the F5 story below.

The full design, including the submit flow and a requirement-to-file traceability
table, is in [`docs/02-architecture.md`](docs/02-architecture.md).

---

## How it was built: the AI Software Factory

### The idea

An AI agent can write code much faster than a person can check it. The factory is
the discipline that keeps the checking in step: a fixed sequence of stations, each
producing a written document, each ending at a gate where the human approves
before anything moves on.

| Role | Did |
|---|---|
| **AI agent** | Asked the questions, drafted every document, wrote every line of code, ran the tests, reviewed its own work, and stopped at every gate |
| **Human** | Answered the questions, made every decision, inspected every diff and every screen, and said no when something was wrong |

### The stations

| Station | Output |
|---|---|
| 1. Requirements | [`docs/01-requirements.md`](docs/01-requirements.md) — what to build, and how to tell when it is done |
| 2. Architecture | [`docs/02-architecture.md`](docs/02-architecture.md) and five ADRs — the shape, and why |
| 3. Planning | [`docs/03-plan.md`](docs/03-plan.md) — thirteen tasks, each with a *done-when* condition |
| 4. Build | One task at a time, each reviewed and approved before it was committed |
| 5. Verification | [`docs/04-verification.md`](docs/04-verification.md) — every acceptance criterion, with the kind of evidence behind it |
| 6. Final review | A dedicated review pass over the whole codebase, then over each round of fixes |

### The rules

The agent's working rules live in [`CLAUDE.md`](CLAUDE.md), which it reads at the
start of every session. The important ones:

- No code before an approved requirement exists.
- One task at a time, stopping for review after each.
- Each task's commit names the task and the requirement it serves.
- Never commit to `main`; every change arrives through a pull request.
- A task is done only when its criteria are met, its tests pass, it has been seen
  working in a browser, any threshold set in the plan has been checked, and the
  human has approved the diff.

Two of those rules were added *during* the project: the git rules after the human
reviewer's first correction, and the threshold check after a limit set in the plan
went unchecked for two tasks. That is how the factory is meant to improve: a
correction becomes a rule, so it does not have to be made twice.

### Four phases, four pull requests

| PR | Phase | Branch | Contents |
|---|---|---|---|
| #1 | A — Documents | `docs/01-requirements` | Requirements, architecture, ADRs and plan — no code at all |
| #2 | B — Logic | `feat/logic` | `validation.js` and `auth.js`, with their tests, before any interface existed |
| #3 | C — Interface | `feat/ui` | Markup, styling, state, validation, sign in and sign out |
| #4 | D — Verify and ship | `chore/verify-and-ship` | The verification record, the final review, its fixes, and this README |

Pull requests were merged with merge commits rather than squashed, so each task
survives in the history as its own commit, named with its task number and, where
one applies, its requirement.

### Documents that correct themselves

When a later station found an earlier one wrong, the earlier document was amended
— with the reason recorded next to the change — rather than being quietly
rewritten. Reading the amendments is the fastest way to see the process working.

---

## What the process caught

Each of these was found by a later stage checking an earlier one — not by anyone
being clever.

**While building**

- **A plan that could not pass.** T1's done-when required a test run with no test
  files, which Node treats as a failure. Found by writing out the exact commands
  before running them.
- **A requirement with a hole in it.** The first email rule accepted `a b@c.com`.
  The code matched the requirement; the requirement was wrong. Found by running the
  finished code against real inputs.
- **Design state that nothing used.** A `submitted` flag in the architecture
  turned out to duplicate what the error state already knew. Found while
  implementing it.
- **A tripwire nobody looked at.** The plan set a size limit on `ui.js` and it
  went unchecked for two tasks. Checking it is now part of the definition of done.

**In verification**

- **Two criteria failing since they were built.** The "Forgot password?" link
  changed the URL, and it was too small to tap reliably. Found by walking every
  acceptance criterion against the source.
- **A published number that was wrong.** A contrast ratio worked out by hand was
  off by 0.8. Found when it was measured by script.

**In the final review**

- **F4 — errors that appeared in silence.** The design relied on moving focus to
  the field with the error so a screen reader would read it. But focusing a field
  that *already* has focus does nothing — so pressing Enter inside a field
  produced its error with no announcement. Both error messages are now polite live
  regions. They stay in the accessibility tree even when empty, because a live
  region has to exist before its text changes, and their text is written only when
  it actually changes, so the page does not repeat an unchanged error on every
  keystroke.
- **F5 — autofill erased by the page itself.** The page kept its own copy of what
  was typed, updated on `input` events, and `render()` made the fields match that
  copy. Password managers and autofill do not always fire `input`, so the copy
  could say "empty" while the fields showed credentials — and the next render
  wrote the blanks back. The page now keeps no copy at all. **ADR-0004 and the
  architecture document were amended** to record the rule this taught: keep in
  state what the page decides, not what the browser or the user owns.
- **A fix for the symptom, not the cause.** The first F5 fix repaired only the one
  path that had been reproduced. Found by reviewing the fix itself.
- **A review aimed at the wrong target.** The first final-review pass compared the
  branch against `main` and so looked only at a few small changes. Every earlier
  check had been made by a sighted person using a mouse and keyboard, with no
  screen reader and no password manager — exactly who never meets F4 or F5 — and neither bug appeared until the review was
  pointed at the whole codebase.

---

## Verification

[`docs/04-verification.md`](docs/04-verification.md) walks all 61 acceptance
criteria. Each result says what *kind* of evidence supports it, because the kinds
are not equally strong:

| Evidence | Meaning |
|---|---|
| **TEST** | An automated test — re-checks itself on every `npm test` |
| **CALC** | Measured by a script, such as the contrast ratios |
| **CODE** | Confirmed by reading the source, with a line reference |
| **SEEN** | Observed by the human reviewer in a real browser |

A criterion whose only possible evidence was never gathered — for this page,
listening with a screen reader — is marked **UNVERIFIED** rather than passed.

The record ends with the browser checklist. After a change, the parts of it that
the change could affect are repeated — decided from the diff — and the record says
which earlier results carried over and why. The final build was verified that way:
a seven-step targeted re-check instead of a full repeat.

---

## Known limitations

- **Not real authentication.** One hardcoded demo account, readable by anyone who
  opens the page's source.
- **The two credential messages reveal which addresses have accounts.** Separate
  "Incorrect email" and "Incorrect password" messages were chosen knowingly for a
  version with one fake account. Before any real user data sits behind a login,
  this must be revisited — see R7 in the requirements.
- **No screen reader has been used.** Everything the page is meant to announce is
  implemented, but four criteria about announcements stay UNVERIFIED until someone
  listens.
- **A repeated, identical error is not announced again.** Press Enter twice with
  the same problem and a screen reader announces the message once. Repeating
  unchanged text needs a timing workaround that could not be verified without a
  screen reader, so it was recorded rather than built.
- **Some screen readers may announce an error twice** when focus moves to the
  field it belongs to — once as the field's description and once from the live
  region. Judged better than silence.
- **The generic "Something went wrong" message has never been seen.** Nothing in
  this version can trigger it; its behaviour is established by reading the code.
- **The email rule is deliberately simple** and will reject some technically valid
  but unusual addresses.
- **The page needs JavaScript and must be served over HTTP.** See Quick start.
- **`src/ui.js` has no automated tests.** It is the one module that touches the
  page, and Node has no page to touch; it is verified by hand with the checklist in
  the verification record.
- **The rule that `validation.js` and `auth.js` never touch the page** is checked
  by searching the source, not enforced by a test.

---

## What comes next: the backend cycle

A real backend is planned as a second learning project, run through the same
stations from the beginning, plus two this project did not need: defining the
contract between two codebases, and migrating existing code onto it.

The front end is already shaped for it. Every sign-in goes through one function:

```js
async function signIn(email, password)
// → { ok: true, email }
// → { ok: false, reason: 'unknown_email' }
// → { ok: false, reason: 'incorrect_password' }
```

It is `async` from day one even though nothing in it waits, so replacing its body
with a request to a server should change nothing else in the page. Whether that
prediction holds is the backend project's first real test — see
[ADR-0003](docs/adr/0003-async-signin-seam.md). That phase must also settle the
account-enumeration question above, and enforce every validation rule again on the
server, which is the only check that counts.

---

## Tech

Plain HTML, CSS and vanilla JavaScript. No framework, no bundler, no build step,
no dependencies. Tests use Node's built-in test runner.
