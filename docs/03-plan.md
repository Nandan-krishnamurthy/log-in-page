# 03 — Implementation plan

**Status:** Approved (three amendments recorded at the end of this document)
**Station:** 3 (Planning)
**Depends on:** `01-requirements.md`, `02-architecture.md` (both approved)
**Date:** 2026-09-10

## How this plan is shaped

Thirteen tasks in four phases. Each phase is one branch and one pull request, so
the git workflow gets exercised four times rather than once.

Two ordering principles decide the sequence:

1. **Testable logic before the interface.** `validation.js` and `auth.js` are
   built and covered by tests before any HTML exists. When the UI misbehaves
   later, the logic underneath it is already known-good, which halves the search
   space for every bug.
2. **One reviewable slice per task.** A task is finished when it can be checked
   against a named acceptance criterion — not when a file is "done".

## Task summary

| # | Task | Covers | Phase |
|---|---|---|---|
| T1 | Project skeleton: `package.json`, `README.md`, folders | ADR-0005 | B |
| T2 | `validation.js` — email and password format rules | R6, R12 | B |
| T3 | `tests/validation.test.js` | R6, R12 | B |
| T4 | `auth.js` — demo account and the `signIn` seam | R7, R12 | B |
| T5 | `tests/auth.test.js` | R7, R12 | B |
| T6 | `index.html` — structure, labels, landmarks | R1–R4, R11 | C |
| T7 | `styles.css` — card, theme, focus, responsive | R1, R9, R10 | C |
| T8 | `ui.js` — state object, `render()`, input wiring, password toggle | R3, ADR-0004 | C |
| T9 | Submit → format validation, inline errors, focus first error | R5, R6, R11 | C |
| T10 | Credential check, the two messages, pending state | R7, R13 | C |
| T11 | Success panel and sign out | R8 | C |
| T12 | Manual verification sweep against every acceptance criterion | R1–R13 | D |
| T13 | README completion and final review | — | D |

## Phases and branches

| Phase | Branch | Tasks | Pull request |
|---|---|---|---|
| A | `docs/01-requirements` *(current)* | Stations 1–3 documents | PR #1 — the factory's paperwork |
| B | `feat/logic` | T1–T5 | PR #2 — pure logic, fully tested |
| C | `feat/ui` | T6–T11 | PR #3 — the page itself |
| D | `chore/verify-and-ship` | T12–T13 | PR #4 — verification and README |

Each branch is cut fresh from `main` after the previous pull request merges.

---

## Phase A — merge the documents

Nothing to build. This phase exists because the documents are the factory, and
they belong on `main` before code starts.

**Resolved:** `gh` is installed and authenticated, and the repository exists as
private. This phase is PR #1.

---

## Phase B — logic, on `feat/logic`

### T1 — Project skeleton
- `package.json` containing `{ "type": "module" }` and a single
  `"scripts": { "test": "node --test" }` entry, so the suite runs as `npm test`.
  Still no dependencies, and nothing is installed. *(Amendment 1 below.)*
- `README.md` stub: what the project is, how to run it, the demo credential, and
  the "must be served over HTTP" warning from ADR-0005.
- Create `src/` and `tests/`.
- `tests/smoke.test.js`: one trivial assertion, proving the runner works before
  anything depends on it. Deleted in T3. *(Amendment 2 below.)*
- **Done when:** `npm test` passes.
- **Commit:** `chore: add project skeleton (T1)`

### T2 — `validation.js`
- `validateEmail(raw)`, `validatePassword(raw)`, `validateForm(values)`.
- Exact messages and rules from R6. Trim before checking. No DOM references.
- **Done when:** the three functions exist and match R6's wording exactly.
- **Commit:** `feat: add email and password validation (T2 / R6)`

### T3 — `tests/validation.test.js`
- Cases: empty, whitespace-only, missing `@`, two `@`, nothing before `@`,
  no dot in domain, dot at the domain edge, valid address, surrounding
  whitespace on a valid address, empty password, single-character password.
- Delete `tests/smoke.test.js`. The runner is now proven by real tests.
- **Done when:** `npm test` passes and every R6 rule has at least one case.
- **Commit:** `test: cover validation rules (T3 / R6, R12)`

### T4 — `auth.js`
- `DEMO_ACCOUNT` in one commented place.
- `async function signIn(email, password)` returning the three result shapes
  from R7. Email compared case-insensitively after trimming and checked first;
  password compared exactly.
- **Done when:** all three result shapes are reachable.
- **Commit:** `feat: add signIn seam with demo account (T4 / R7)`

### T5 — `tests/auth.test.js`
- Success; `unknown_email`; `incorrect_password`; email case and whitespace
  insensitivity; password case sensitivity; confirmation that a wrong email
  never yields `incorrect_password`.
- **Done when:** `node --test` passes with both files.
- **Commit:** `test: cover signIn success and failure paths (T5 / R7, R12)`

**Phase B exit:** `node --test` green, no `src/*.js` file mentions `document` or
`window`. Open PR #2.

---

## Phase C — interface, on `feat/ui`

### T6 — `index.html`
- One `<form>`, labelled email and password inputs with the autocomplete values
  from R2/R3, the toggle button, the "Forgot password?" link, the submit button,
  an empty error slot beneath each field, and an original wordmark.
- Correct `type`, `id`/`for` pairing, and an `aria-live` region for messages.
- **Done when:** the structure is keyboard-navigable in a sensible order with no
  CSS or JS present.
- **Commit:** `feat: add login form markup (T6 / R1-R4, R11)`

### T7 — `styles.css`
- Centred card, max width ~400px, neutral background, one accent colour.
- Visible focus rings, error styling, 44px tap targets, no horizontal scroll at
  320px, WCAG AA contrast.
- **Done when:** checked at 320px, 768px and desktop width.
- **Commit:** `feat: style the login card (T7 / R1, R9, R10)`

### T8 — `ui.js` foundation
- The state object from ADR-0004, a `render(state)` that sets every property it
  governs on every call, and event wiring.
- Password visibility toggle, including its accessible state.
- **Done when:** typing updates state, and the toggle switches the field both
  ways with the button's announced state changing too.
- **Commit:** `feat: add state and render loop with password toggle (T8 / R3)`

### T9 — Submit and format validation
- Submit calls `validateForm`, stores messages, renders them inline with
  `aria-invalid` and `aria-describedby`, and focuses the first invalid field.
- Live re-validation after the first submit, per R5.
- **Done when:** each R6 message can be produced and cleared by editing.
- **Commit:** `feat: validate on submit with inline errors (T9 / R5, R6, R11)`

### T10 — Credentials and pending state
- Await `signIn`, map `unknown_email` and `incorrect_password` to their fields.
- Pending state: button disabled and relabelled, inputs read-only, no double
  submit, restored in a `finally` so no outcome can leave it stuck.
- A `default` branch in the result mapping renders the generic message for any
  unrecognised `reason` (R7 amendment).
- **Done when:** both credential messages appear under the right field, clear on
  edit, and the pending state cannot be left stuck.
- **Commit:** `feat: wire credential check and pending state (T10 / R7, R13)`

### T11 — Success and sign out
- Replace the form with the signed-in panel showing the email.
- Sign out resets to the first-visit state and focuses the email field.
- **Done when:** sign in and sign out can be cycled repeatedly with no residue.
- **Commit:** `feat: add signed-in panel and sign out (T11 / R8)`

**Phase C exit:** every requirement demonstrably works. Open PR #3.

---

## Phase D — verify and ship, on `chore/verify-and-ship`

### T12 — Verification sweep
- Walk every acceptance criterion in R1–R13 and record pass or fail in
  `docs/04-verification.md`.
- Keyboard-only pass. Narrow-viewport pass. Contrast check.
- Fix what fails, or record it as a known limitation with a reason.
- **Done when:** every criterion is marked, nothing silently skipped.
- **Commit:** `test: record manual verification against R1-R13 (T12)`

### T13 — README and final review
- Complete the README. Re-read the full diff as a critic.
- **Done when:** the definition of done in `CLAUDE.md` is satisfied.
- **Commit:** `docs: complete README and final review notes (T13)`

**Phase D exit:** PR #4, then the project is done.

---

## Estimation

Not given deliberately. Wall-clock time here measures how fast you read and
review, not how fast the work goes, and a number would only invite rushing the
gates — which are the part of this exercise that matters.

## What could go wrong

| Risk | Handling |
|---|---|
| Email validation rules argue with real-world addresses | R6 defines a deliberately simple rule. It will reject some valid exotic addresses. Accepted and recorded, not fixed by escalating to a regex nobody can read. |
| `ui.js` grows past the point where reading it substitutes for testing it | Threshold is roughly 200 lines **of code**, not counting comments or blank lines. At that point, stop and reconsider ADR-0002's testing split rather than pressing on. Reviewed at the end of Phase C at 133 lines of code (297 total) and accepted — see Amendment 3. |
| The two error systems collide in one slot | Prevented by ordering: R6 runs to completion before R7 begins. Verified explicitly in T12. |
| Pending state gets stuck after an unexpected failure | T10's done-condition names this. Restore the state in a `finally`. |

## Resolved questions

1. **GitHub.** The `gh` CLI is installed and authenticated. The repository is
   created as **private**, named `log-in-page`, with this machine as the source.
2. **Merge strategy.** Merge commits, not squash. Squashing would collapse the
   per-task commits into one and destroy the task-to-requirement references that
   `CLAUDE.md` rule 3 requires. The standard decided this, not preference.

## Amendments

Recorded rather than silently applied, because a plan that gets quietly rewritten
stops being a plan.

1. **`npm test` script added to `package.json`** (T1). ADR-0005 specified
   `{ "type": "module" }` "and nothing else". A `scripts.test` entry installs
   nothing and adds no dependency, so it does not violate the intent of that ADR,
   and it was approved explicitly at Station 3.
2. **T1's done-when was unreachable and is corrected** (T1, T3). It originally
   read "`node --test` runs and reports zero tests without erroring". Node's test
   runner exits with a failure when it finds no test files, so no version of T1
   could ever have satisfied it. T1 now creates a one-assertion smoke test,
   proving the harness works before real tests rely on it, and T3 deletes that
   file once `validation.test.js` exists.

   This was caught by writing out T1's exact commands before running them. The
   lesson is worth keeping: the cheapest place to find a broken plan is one step
   before executing it.
3. **The `ui.js` size threshold is measured in lines of code, and was reviewed
   at 133 and accepted** (Phase C). The risk table said "roughly 200 lines"
   without saying whether comments count. At the end of Phase C, `ui.js` had 297
   lines in total and 133 lines of code.

   The threshold was not checked at T9 or T10, when the total first passed 200 —
   only while preparing PR #3. A tripwire that nobody looks at does not trip.

   On review: one `render` function and a handful of handlers remain readable in
   a single sitting, and T12's manual verification sweep is the check that
   compensates for `ui.js` having no automated tests. Moving its near-pure logic —
   `initialState`, the result mapping in `applyResult`, the re-validation rule in
   `handleInput` — into a DOM-free module under `node --test` was considered and
   deferred. It is the response to reach for if the file grows further.
