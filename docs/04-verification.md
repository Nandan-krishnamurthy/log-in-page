# 04 — Verification record

**Status:** Complete — 57 of 58 criteria pass; one cannot be observed in this version
**Station:** 6 (Verification) — task T12
**Depends on:** `01-requirements.md` R1–R13 as amended
**Build verified:** `main` at `1276e98` (after PR #3), plus the T12 fixes on branch `chore/verify-and-ship`
**Date:** 2026-09-11

## How to read this record

Every acceptance criterion in R1–R13 appears below, with the evidence behind it.
The evidence is labelled by kind, because the kinds are not equally strong:

| Label | Meaning | Strength |
|---|---|---|
| **TEST** | Covered by an automated test under `npm test` | Re-checks itself on every run |
| **CALC** | Measured by a script, with the result recorded here | Exact, but only when re-run |
| **CODE** | Confirmed by reading the source, with a line reference | True of this build; silent if the code changes |
| **SEEN** | Observed by the reviewer in a real browser | The only evidence for how the page looks and behaves to a person |

And each criterion has one status:

| Status | Meaning |
|---|---|
| **PASS** | Fully evidenced |
| **PENDING** | Code evidence in place; awaiting the reviewer's check on the final build |
| **FAIL** | Does not meet the criterion as written |

Most visual and interactive criteria were first checked by the reviewer at their
task's gate during T6–T11. They were checked again on the final build for this
record, because later tasks changed shared files — T10 and T11 both edited the
markup that T6 created, and T12 itself changed all three — so a check made on an
earlier build does not prove the final one.

## Summary

| | Count |
|---|---|
| Criteria | 58 |
| PASS | 57 |
| PENDING | 0 |
| FAIL | 0 |
| Not observable in this version | 1 |

Counted from the rows below by script. The first draft of this table was typed by
hand and had three of its five numbers wrong — in a document whose whole purpose
is not to state unchecked figures.

## Findings

### F1 — R4: the placeholder link navigated · **fixed in this task**

R4 requires that "Forgot password?" performs no navigation. It had `href="#"`, so
activating it changed the URL to `/#` and added an entry to the browser's history —
pressing Back then stayed on the page instead of leaving it.

**The requirement was right and the code was wrong**, so the code changed. Compare
the R6 amendment at T2, where the code was right and the requirement was wrong.
Which of the two is wrong decides which one you fix.

**Fix:** the link now has an id (`index.html:125`), and a click handler cancels the
navigation (`ui.js:219–224`). The `href` stays, because an `<a>` without one is not
keyboard-focusable, which would fail R4's other criterion.

Without JavaScript the link would still jump to `#`. That is acceptable here only
because the page does not work at all without JavaScript (ADR-0005).

### F2 — R10: the placeholder link was too small a tap target · **fixed in this task**

R10 requires tap targets at least 44px tall on small screens. The inputs and both
buttons used `--tap-target`; the link had never been given a minimum and was the
height of one line of small text, about 21px.

**Fix, CSS only:** the link is now an inline-flex box at least `--tap-target` tall
(`styles.css:244–247`), and its wrapper's margins pull in at both ends
(`styles.css:235`) so the text sits about where it did before.

One visible side effect for the reviewer to judge: the link's focus ring now
outlines the full 44px box, so it is noticeably taller than the text inside it.
That is the tap area made visible, not a bug — but it is a change in appearance.
Reviewed on the final build and accepted.

### F3 — a published contrast figure was wrong · **fixed in this task**

The comment at `styles.css:18` said body text was **16.1:1** on white. Measured by
script for this record, it is **16.91:1**. The error understated a pass, so no
colour changes — but the figure was also repeated in the T7 commit message and the
PR #3 description, and those cannot be edited. The comment is corrected; this entry
is the correction for the other two.

The lesson is about evidence, not arithmetic: a number worked out by hand and typed
into a comment is a claim. The same number produced by a script is a measurement.

---

## Results by requirement

### R1 — Page layout

| Criterion | Evidence | Status |
|---|---|---|
| Card is centred horizontally and vertically | CODE `body` flex centring, `styles.css:62–64` · SEEN on the final build | PASS |
| Card is about 400px wide at most and does not stretch | CODE `styles.css:79` · SEEN on the final build | PASS |
| No other page furniture | CODE one `<main>` and nothing else in `<body>`, `index.html:11` · SEEN on the final build | PASS |

### R2 — Email field

| Criterion | Evidence | Status |
|---|---|---|
| Visible label, programmatically associated | CODE `for="email"`, `index.html:69` · SEEN on the final build: clicking the label focuses the input | PASS |
| `type="email"` and `autocomplete="email"` | CODE `index.html:74–75` | PASS |
| Surrounding whitespace ignored | TEST *accepts surrounding whitespace, which is trimmed*; *ignores surrounding whitespace on the email* · CODE `validation.js:34`, `auth.js:45` | PASS |

### R3 — Password field with show/hide toggle

| Criterion | Evidence | Status |
|---|---|---|
| Associated label and `autocomplete="current-password"` | CODE `index.html:89`, `:96` | PASS |
| Toggle switches between `password` and `text` | CODE `ui.js:97` · SEEN on the final build | PASS |
| Toggle is keyboard-reachable and announces its state | CODE real `<button>` with `aria-pressed`, `index.html:109–110`, kept in step at `ui.js:99` · SEEN on the final build | PASS |
| Toggle does not submit the form | CODE `type="button"`, `index.html:109` · SEEN on the final build | PASS |

### R4 — "Forgot password?" link

| Criterion | Evidence | Status |
|---|---|---|
| Visible and keyboard-focusable | CODE `<a href="#">`, `index.html:125` · SEEN on the final build | PASS |
| Performs no navigation | CODE click handler cancels navigation, `ui.js:219–224` — **fixed, see F1** · SEEN on the final build: address bar unchanged after clicking | PASS |

### R5 — Validation timing

| Criterion | Evidence | Status |
|---|---|---|
| No error before the first submit | CODE errors start `null` in `initialState`, `ui.js:34`; only submit sets them · SEEN on the final build | PASS |
| After a failed submit, an erroring field re-checks on input and clears when valid | CODE `handleInput`, `ui.js:159–164` · SEEN on the final build | PASS |
| A field with no error is not validated on input | CODE the guard at `ui.js:164` · SEEN on the final build | PASS |
| Editing clears a credential error too | CODE the same guard; a credential error only exists on a well-formed value, so re-checking returns `null` · SEEN on the final build | PASS |

### R6 — Field validation rules and inline errors

| Criterion | Evidence | Status |
|---|---|---|
| Email rules: required, no internal whitespace, one `@`, text before it, two or more non-empty domain labels | TEST 21 cases in `tests/validation.test.js` · CODE `validation.js:34–53` | PASS |
| Password: required only, no strength rule, not trimmed | TEST 5 cases, including *accepts a single space, because passwords are not trimmed* · CODE `validation.js:70` | PASS |
| Exact message wording | TEST *matches the requirement exactly* pins all three literals · CODE `validation.js:16–18` | PASS |
| Each message appears beneath its own field | CODE each input's `aria-describedby` points at its own slot, `index.html:76`, `:97` · SEEN on the final build | PASS |
| Invalid input is marked by border colour and `aria-invalid`, linked by `aria-describedby` | CODE `ui.js:130`, `:134`; `styles.css:185` · SEEN on the final build | PASS |
| Focus moves to the first field in error | CODE `ui.js:266–273` · SEEN on the final build | PASS |
| Client validation is recorded as a convenience, not a control | CODE stated in the module header of `validation.js` | PASS |

### R7 — Credential check and failure messages

| Criterion | Evidence | Status |
|---|---|---|
| Demo account in one commented place, documented in the README as a stub | CODE `auth.js:22`; README "Demo credentials" | PASS |
| Email compared ignoring case and whitespace; password compared exactly | TEST *ignores the case of the email*; *is case sensitive*; *does not trim the password* · CODE `auth.js:45`, `:61` | PASS |
| "Incorrect email" under email, "Incorrect password" under password | CODE mapping at `ui.js:181` · SEEN on the final build | PASS |
| One credential message at a time; email checked first | TEST *returns unknown_email even when the password is correct* · CODE `auth.js:55` | PASS |
| Credential messages distinct from R6's, same slot and styling | CODE different messages, same `renderFieldError` path · SEEN on the final build | PASS |
| Credential messages carry `aria-invalid` and `aria-describedby` like R6's | CODE same path, `ui.js:130` · SEEN on the final build | PASS |
| Neither field is cleared on failure | CODE `applyResult` never writes `values` · SEEN on the final build | PASS |
| `signIn` is async and returns the documented result shapes | TEST *returns a promise*; *only ever returns the three documented reasons*; *carries no email on a failure result* | PASS |
| An unrecognised result shows the generic message in the form-level region | CODE `ui.js:174`, default branch in `applyResult`, and `catch` at `:286` · **cannot be reached in this version** | NOT OBSERVABLE |

The last row can be observed only by temporarily making `signIn` return an unknown
reason, as the pending state was observed at T10. It was offered as optional check
G and not run, so it stands as a **known limitation**: this behaviour is
established by reading the code, and by nothing else.

### R8 — Success state

| Criterion | Evidence | Status |
|---|---|---|
| Panel shows a confirmation and the signed-in email | CODE `ui.js:111–115` · SEEN on the final build | PASS |
| Sign out returns to an empty, error-free form | CODE `Object.assign(state, initialState())`, `ui.js:236` · SEEN on the final build | PASS |
| Happens in place; the browser does not navigate | CODE `preventDefault()`, `ui.js:247`; no navigation API anywhere in `src/` · SEEN on the final build | PASS |
| Nothing persisted; refresh returns to the form | CODE state is in memory only; no storage API anywhere in `src/` · SEEN on the final build | PASS |
| Sign out resets values, errors and the password toggle | CODE the same `initialState()` that built the first state · SEEN on the final build: the no-residue cycle | PASS |
| Focus moves to the email field after sign out | CODE `ui.js:240` · SEEN on the final build | PASS |

### R9 — Visual design

| Criterion | Evidence | Status |
|---|---|---|
| Soft neutral background, white card, dark text | CODE tokens at `styles.css:13–28` · SEEN on the final build | PASS |
| One accent, used for the primary button and focus rings | CODE `--accent`, `styles.css:24`; focus ring `:357` | PASS |
| System font stack; no web fonts | CODE `styles.css:68`; no `@font-face` or font import anywhere in `src/` | PASS |
| Visible focus ring on every interactive element | CODE one `:focus-visible` rule, `styles.css:357` · SEEN on the final build: keyboard pass | PASS |
| WCAG AA contrast | CALC — all 15 colour pairs pass; table below | PASS |

### R10 — Responsive behaviour

| Criterion | Evidence | Status |
|---|---|---|
| Usable from 320px to large desktop | CODE `max-width` and the narrow-screen rule, `styles.css:79`, `:88` · SEEN on the final build | PASS |
| No horizontal page scrolling | CODE body side padding `styles.css:59`; long addresses wrap `:347` · SEEN on the final build at 320px | PASS |
| Tap targets at least 44px tall | CODE inputs `styles.css:164`, the link `:247`, and buttons `:262` all use `--tap-target` — **link fixed, see F2** · SEEN on the final build | PASS |

### R11 — Accessibility

| Criterion | Evidence | Status |
|---|---|---|
| Whole flow operable by keyboard alone, in a sensible order | SEEN on the final build: keyboard-only pass | PASS |
| Enter submits from either input | CODE a real form with a real submit button · SEEN on the final build | PASS |
| A real `<form>` and a real submit button | CODE `index.html:67`, `:128` | PASS |
| Errors and success conveyed to assistive technology, not by colour alone | CODE every error is text, not only a red border; `role="alert"` `index.html:59`; `role="status"` `:148`; focus to the heading on success `ui.js:199` · SEEN on the final build | PASS |

### R12 — Testable logic is separated

| Criterion | Evidence | Status |
|---|---|---|
| Pure functions in their own modules with no DOM access | CODE no `document`, `window`, `localStorage`, `sessionStorage`, `navigator` or `alert` in `validation.js` or `auth.js` — re-checked on this build | PASS |
| `node --test` passes with no installed dependencies | TEST 45 passing on this build; `package.json` declares no dependencies | PASS |
| `signIn` tested through both success and failure | TEST 15 cases in `tests/auth.test.js` | PASS |

### R13 — Pending state while signing in

| Criterion | Evidence | Status |
|---|---|---|
| Submit button disabled and relabelled | CODE `ui.js:105–106` · SEEN at T10 with a temporary delay | PASS |
| Inputs read-only for the duration | CODE `ui.js:103–104` · SEEN at T10 | PASS |
| A second submit cannot start | CODE guard at `ui.js:252`, plus the disabled button · SEEN at T10 | PASS |
| Form returns to normal on success and on failure | CODE `finally`, `ui.js:291` · SEEN at T10, both paths | PASS |
| Pending state announced to assistive technology | CODE `role="status"` region `index.html:148`, set at `ui.js:107` | PASS |

R13 is the one requirement marked PASS on a browser observation made before the
final build. That holds because neither T11 nor T12 changed the code that controls
the pending state — the guard, the `finally`, and the read-only, disabled and
status lines are identical in the final build; only their line numbers moved.

---

## Contrast measurements

Computed from the WCAG 2.x relative-luminance formula by a script, for every
colour pair the page actually renders. Text needs 4.5:1; the boundary of a control
needs 3:1 (WCAG 1.4.11). Disabled controls are exempt and are not listed.

| Pair | Ratio | Needs | |
|---|---|---|---|
| Body text on card | 16.91:1 | 4.5:1 | ✓ |
| Muted text on card | 6.25:1 | 4.5:1 | ✓ |
| Muted text in a read-only input | 5.83:1 | 4.5:1 | ✓ |
| Body text in an invalid input | 15.53:1 | 4.5:1 | ✓ |
| Field error text on card | 6.54:1 | 4.5:1 | ✓ |
| Form-level error text on its tinted background | 6.00:1 | 4.5:1 | ✓ |
| Link, toggle and secondary button text on card | 7.19:1 | 4.5:1 | ✓ |
| Secondary button text on its hover background | 6.71:1 | 4.5:1 | ✓ |
| White on the primary button | 7.19:1 | 4.5:1 | ✓ |
| White on the primary button, hover | 9.25:1 | 4.5:1 | ✓ |
| White on the primary button, active | 11.51:1 | 4.5:1 | ✓ |
| Input border on card | 3.14:1 | 3:1 | ✓ |
| Invalid input border on card | 6.54:1 | 3:1 | ✓ |
| Focus ring on card | 7.19:1 | 3:1 | ✓ |
| Secondary button border on card | 7.19:1 | 3:1 | ✓ |
| *Reference: a typical pale input border, not used* | *1.40:1* | *3:1* | *✗* |

Four of these pairs had never been checked before this record: the two tinted
error backgrounds, the read-only background, and the button hover and active
states. All four pass. They were found by listing every pair the page draws rather
than every colour it defines.

## Plan thresholds

Checked per the definition of done in `CLAUDE.md`.

| Threshold | Measured | |
|---|---|---|
| `ui.js` at roughly 200 lines of code | 137 lines of code (306 in total), after the F1 fix | Under |

---

## Final browser checks for the reviewer

About ten minutes, on the final build. Hard-refresh first (**Ctrl+Shift+R**).

> **Completed 2026-09-11 by the reviewer, on the final build: A–F all as
> expected. G was not run.** The list stays here as the procedure to repeat after
> any future change to `src/`.

**A. Keyboard only** — R3, R4, R9, R11
1. Tab from the top: Email → Password → Show → Forgot password? → Sign in.
2. Every stop shows a visible focus ring.
3. Space on Show toggles it; the label changes between Show and Hide.
4. Enter submits from inside either input.

**B. Validation** — R5, R6
1. Submit empty: both messages, both inputs red, focus on Email.
2. Type a valid email: its error clears while you type; the password error stays.
3. Clear the email again: no error returns until the next submit.

**C. Credentials** — R7
1. `nobody@example.com` and anything: "Incorrect email" under email, focus there.
2. `demo@example.com` and a wrong password: "Incorrect password" under password.
3. After either, both fields still hold what you typed.
4. Type one character into the field in error: the message clears at once.

**D. Sign in and out** — R8
1. Sign in as `  DEMO@Example.COM  ` / `password123`: the panel shows `demo@example.com`, the address bar is unchanged.
2. Tab once: focus lands on Sign out.
3. Sign out: empty form, "Sign in" heading back, cursor in Email.
4. Cause an error, click Show, sign in, sign out: no error, password hidden, label reads Show.
5. Sign in, then refresh: back at the form.

**E. Narrow screen** — R1, R10
1. DevTools device toolbar at **320px**: the card fits and nothing scrolls sideways.
2. Repeat at 768px and full width: the card stays centred and never wider than about 400px.

**F. Confirm the two fixes** — R4, R10
1. Click Forgot password?: the address bar does **not** change (F1).
2. At 320px, hover the link with DevTools' element picker: its box is **44px** tall (F2).
3. Tab to the link: the focus ring is taller than the text. Judge whether that looks acceptable (F2's side effect).
4. The space between the password field, the link and Sign in should look about the same as before.

**G. See the generic failure message** — optional, R7
The one behaviour on the page nobody has seen. On request, a temporary change makes
`signIn` return a reason the form does not recognise; it is reverted before
anything is committed, exactly as the delay was at T10.
