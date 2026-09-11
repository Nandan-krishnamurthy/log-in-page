# 04 — Verification record

**Status:** Complete — 56 of 61 criteria pass; 4 are unverified because no screen reader was used, and 1 cannot be observed in this version
**Station:** 6 (Verification) — task T12, amended at T13
**Depends on:** `01-requirements.md` R1–R13 as amended
**Build verified:** `main` at `1276e98` (after PR #3), plus the T12 and T13 fixes on branch `chore/verify-and-ship`
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
| **UNVERIFIED** | Implemented, but the one instrument that could confirm it has not been used |
| **FAIL** | Does not meet the criterion as written |
| **NOT OBSERVABLE** | Cannot be made to happen in this version |

**UNVERIFIED is for what a screen reader says.** No screen reader has been used at
any point in this project. A sighted reviewer can see that an element is a live
region, but cannot hear whether it is announced, so every criterion that claims
something is *announced* or *conveyed to assistive technology* rests on reading
the code. The first version of this record marked those PASS on evidence that
could not support them.

## How the final build was verified

The reviewer completed a full browser pass on the T12 build (commit `7055562`).
The final review then changed `ui.js`, `index.html` and `styles.css`. A check made
on an earlier build does not prove a later one — **unless the diff shows that none
of the code behind it changed, and that reasoning is written down.** So rather than
repeat the whole checklist, the diff since the T12 pass decided what to re-check.

Ignoring comments, these are the only changes to the page since that pass:

| Change | What it could affect |
|---|---|
| Both error slots are polite live regions (`aria-live`) | Announcements only; nothing visible |
| An empty error slot stays in the layout at zero height (`margin-top: -6px`) instead of `display: none` | Spacing around the fields |
| Error, form-message and status text is written only when it changes (`setText`) | Errors appearing and clearing |
| `render()` no longer writes into the fields; the handlers and submit read them directly | Validation, credential results, whether fields keep their contents |
| Sign out clears the fields with `form.reset()` | Sign out, and the first-visit state |

Tab order, focus handling, the password toggle, the placeholder link, the pending
state, every colour, and all of `auth.js` and `validation.js` are unchanged.

**Result.** 20 criteria were re-checked on the final build in a seven-step targeted
pass; each is marked *SEEN in the targeted re-check*. The other 14 rest on the T12
pass because nothing behind them changed; each is marked *SEEN at the T12 pass,
carried over*. All seven steps passed on 2026-09-11.

Step 7 — refreshing while signed in — returned the signed-out form with **both
fields empty**: the browser did not restore their contents. That is recorded
because the page no longer blanks restored contents itself (F5). A browser that
did restore them would still meet R8, which is about the session, not the fields.

## Summary

| | Count |
|---|---|
| Criteria | 61 |
| PASS | 56 |
| PENDING | 0 |
| UNVERIFIED | 4 |
| FAIL | 0 |
| Not observable in this version | 1 |

Counted from the rows below by script. The first draft of this table was typed by
hand and had three of its five numbers wrong — in a document whose whole purpose
is not to state unchecked figures.

There are 61 criteria rather than the 58 of the first version because three
criteria had two different claims folded into one row, and one claim had been
dropped altogether. Each claim is now its own row: see F4.

## Findings

### F1 — R4: the placeholder link navigated · **fixed at T12**

R4 requires that "Forgot password?" performs no navigation. It had `href="#"`, so
activating it changed the URL to `/#` and added an entry to the browser's history.

**The requirement was right and the code was wrong**, so the code changed. Compare
the R6 amendment at T2, where the code was right and the requirement was wrong.
Which of the two is wrong decides which one you fix.

**Fix:** the link has an id (`index.html:130`) and a click handler cancels the
navigation (`ui.js:230–235`). The `href` stays, because an `<a>` without one is not
keyboard-focusable, which would fail R4's other criterion. Without JavaScript the
link would still jump to `#`; that is acceptable only because the page does not
work at all without JavaScript (ADR-0005).

### F2 — R10: the placeholder link was too small a tap target · **fixed at T12**

R10 requires tap targets at least 44px tall on small screens. The link had never
been given a minimum and was about 21px tall.

**Fix, CSS only:** the link is an inline-flex box at least `--tap-target` tall
(`styles.css:246–249`), and its wrapper's margins pull in at both ends
(`styles.css:237`) so the text sits about where it did. Its focus ring now outlines
the full 44px box — the tap area made visible. Reviewed and accepted.

### F3 — a published contrast figure was wrong · **fixed at T12**

The comment at `styles.css:18` said body text was **16.1:1** on white. Measured by
script, it is **16.91:1**. The error understated a pass, so no colour changes, but
the figure was also repeated in the T7 commit message and the PR #3 description,
which cannot be edited. This entry is the correction for those.

A number worked out by hand and typed into a comment is a claim. The same number
produced by a script is a measurement.

### F4 — errors could appear without being announced · **fixed at T13, with one limitation**

Found by the final review. T9 relied on moving focus to the field in error, so
that a screen reader would read the field and, through `aria-describedby`, its
message. But focusing a field that already has focus does nothing. Press Enter
inside the password field and "Incorrect password" — or "Password is required" —
appeared in silence, because focus was already where the code sent it and the
message slots were not live regions.

It went unnoticed for two reasons, both about evidence. R7's requirement that
credential messages be "announced to screen readers when they appear" had been
folded into a row that only checked attributes, so it was never tracked as a
criterion of its own. And R11's row was marked PASS on code and on sight — neither
of which can observe what a screen reader says.

**Fix:** both message slots are polite live regions (`index.html:90`, `:121`). An
empty slot stays in the accessibility tree at zero height instead of being removed
with `display: none` (`styles.css:233`), because a live region has to exist before
its text changes — the same reason as the form-level message at T10.

Building that fix exposed a second problem that it would otherwise have caused:
`render` runs on every keystroke and rewrote every message each time, so a live
region could have repeated "Password is required" on every key pressed in the email
field. Text is now written only when it changes (`setText`, `ui.js:147`).

**Known limitation:** that same rule means an identical message on a repeated
submit — Enter pressed twice in an empty, focused field — is not announced a
second time. The first appearance is. Re-announcing identical text needs a timing
workaround that could not be verified without a screen reader, so it is recorded
rather than built. When focus *does* move to the field, some screen readers will
read the message twice; repeated is judged better than silent.

### F5 — autofill could be erased by the page · **fixed at T13**

Found by the final review. The page kept its own copy of the two field values,
updated on `input` events, and `render` made the fields match that copy. Some
password managers and autofill fill a field without firing `input`. The copy then
said "empty" while the fields showed credentials — and the next render, from a
submit, a click on Show, or typing in the other field, wrote the empty copy back
and erased them. R2 and R3 ask for `autocomplete` attributes precisely to invite
autofill, so the page was breaking what its own markup requested.

**The first fix was incomplete.** It made submit read the fields directly, which
repaired the path that had been reproduced. A review of that fix found that Show
and typing still erased them: the fix addressed the symptom, not the cause.

**Fix:** the page keeps no copy. Field values are gone from the state object,
`render` never writes into an input, and code reads `el.email.value` and
`el.password.value` when it needs them (`ui.js:276`). Sign out clears the fields
with the form's own `reset()` (`ui.js:254`), the one place a handler writes to the
DOM. ADR-0004 and the architecture document are amended to match.

Verified in the browser: fields filled from the console, with no input event,
survived Show, typing in the other field, and signing in (targeted re-check,
step 5).

### How the final review ran

Four passes of the review station, recorded because the sequence is the lesson.

1. **Pointed at the wrong range.** Asked to review the whole codebase, it compared
   the branch with `main` and saw only T12's three small changes. It passed them.
   A review is only as good as what it is aimed at.
2. **The whole codebase,** from the scaffold commit forward. Found F4 and F5 —
   neither visible to a sighted person using a mouse and keyboard without a
   password manager, which describes every check made before it.
3. **The fixes.** Found that the F5 fix covered only submit, and that a new code
   comment claimed an error was "heard either way" when a repeat is not.
4. **The fixes to the fixes.** Found no bugs in the code, and found this record
   stale — still describing the code as it was before F5.

---

## Results by requirement

### R1 — Page layout

| Criterion | Evidence | Status |
|---|---|---|
| Card is centred horizontally and vertically | CODE `body` flex centring, `styles.css:62–64` · SEEN at the T12 pass, carried over | PASS |
| Card is about 400px wide at most and does not stretch | CODE `styles.css:79` · SEEN at the T12 pass, carried over | PASS |
| No other page furniture | CODE one `<main>` and nothing else in `<body>`, `index.html:11` · SEEN at the T12 pass, carried over | PASS |

### R2 — Email field

| Criterion | Evidence | Status |
|---|---|---|
| Visible label, programmatically associated | CODE `for="email"`, `index.html:69` · SEEN at the T12 pass, carried over: clicking the label focuses the input | PASS |
| `type="email"` and `autocomplete="email"` | CODE `index.html:74–75` | PASS |
| Surrounding whitespace ignored | TEST *accepts surrounding whitespace, which is trimmed*; *ignores surrounding whitespace on the email* · CODE `validation.js:34`, `auth.js:45` | PASS |

### R3 — Password field with show/hide toggle

| Criterion | Evidence | Status |
|---|---|---|
| Associated label and `autocomplete="current-password"` | CODE `index.html:94`, `:101` | PASS |
| Toggle switches between `password` and `text` | CODE `ui.js:94` · SEEN in the targeted re-check (step 5) | PASS |
| Toggle is reachable by keyboard | CODE a real `<button>`, `index.html:114` · SEEN at the T12 pass, carried over | PASS |
| Toggle announces its current state to screen readers | CODE `aria-pressed`, `index.html:115`, kept in step at `ui.js:96` · no screen reader used | UNVERIFIED |
| Toggle does not submit the form | CODE `type="button"`, `index.html:114` · SEEN in the targeted re-check (step 5) | PASS |

### R4 — "Forgot password?" link

| Criterion | Evidence | Status |
|---|---|---|
| Visible and keyboard-focusable | CODE `<a href="#">`, `index.html:130` · SEEN at the T12 pass, carried over | PASS |
| Performs no navigation | CODE click handler cancels navigation, `ui.js:230–235` — see F1 · SEEN at the T12 pass, carried over: address bar unchanged | PASS |

### R5 — Validation timing

| Criterion | Evidence | Status |
|---|---|---|
| No error before the first submit | CODE errors start `null` in `initialState`, `ui.js:40`; only submit sets them · SEEN in the targeted re-check (step 1) | PASS |
| After a failed submit, an erroring field re-checks on input and clears when valid | CODE `handleInput`, `ui.js:172–175` · SEEN in the targeted re-check (step 3) | PASS |
| A field with no error is not validated on input | CODE the guard at `ui.js:175` · SEEN in the targeted re-check (step 3) | PASS |
| Editing clears a credential error too | CODE the same guard; a credential error only exists on a well-formed value, so re-checking returns `null` · SEEN in the targeted re-check (step 4) | PASS |

### R6 — Field validation rules and inline errors

| Criterion | Evidence | Status |
|---|---|---|
| Email rules: required, no internal whitespace, one `@`, text before it, two or more non-empty domain labels | TEST 21 cases in `tests/validation.test.js` · CODE `validation.js:34–53` | PASS |
| Password: required only, no strength rule, not trimmed | TEST 5 cases, including *accepts a single space, because passwords are not trimmed* · CODE `validation.js:70` | PASS |
| Exact message wording | TEST *matches the requirement exactly* pins all three literals · CODE `validation.js:16–18` | PASS |
| Each message appears beneath its own field | CODE each input's `aria-describedby` points at its own slot, `index.html:76`, `:102` · SEEN in the targeted re-check (step 2) | PASS |
| Invalid input is marked by border colour and `aria-invalid`, linked by `aria-describedby` | CODE `ui.js:127`, `:131`; `styles.css:185` · SEEN in the targeted re-check (step 2) | PASS |
| Focus moves to the first field in error | CODE `ui.js:289–296` · SEEN in the targeted re-check (step 2) | PASS |
| Client validation is recorded as a convenience, not a control | CODE stated in the module header of `validation.js` | PASS |

### R7 — Credential check and failure messages

| Criterion | Evidence | Status |
|---|---|---|
| Demo account in one commented place, documented in the README as a stub | CODE `auth.js:22`; README "Sign in" | PASS |
| Email compared ignoring case and whitespace; password compared exactly | TEST *ignores the case of the email*; *is case sensitive*; *does not trim the password* · CODE `auth.js:45`, `:61` | PASS |
| "Incorrect email" under email, "Incorrect password" under password | CODE mapping at `ui.js:192` · SEEN in the targeted re-check (step 4) for "Incorrect password"; "Incorrect email" SEEN at the T12 pass, carried over — same mapping and rendering path | PASS |
| One credential message at a time; email checked first | TEST *returns unknown_email even when the password is correct* · CODE `auth.js:55` | PASS |
| Credential messages distinct from R6's, same slot and styling | CODE different messages, same `renderFieldError` path · SEEN in the targeted re-check (step 4) | PASS |
| Credential messages carry `aria-invalid` and `aria-describedby` like R6's | CODE same path, `ui.js:127` · SEEN in the targeted re-check (step 4) | PASS |
| Credential messages are announced to screen readers when they appear | CODE live-region slots `index.html:90`, `:121`, written through `setText` `ui.js:124` — see F4, including the repeated-submit limitation · no screen reader used | UNVERIFIED |
| Neither field is cleared on failure | CODE nothing in `ui.js` writes an input's value except `form.reset()` on sign out, `ui.js:254` · SEEN in the targeted re-check (step 4) | PASS |
| `signIn` is async and returns the documented result shapes | TEST *returns a promise*; *only ever returns the three documented reasons*; *carries no email on a failure result* | PASS |
| An unrecognised result shows the generic message in the form-level region | CODE `ui.js:185`, default branch in `applyResult`, and `catch` at `:309` · **cannot be reached in this version** | NOT OBSERVABLE |

The last row can be observed only by temporarily making `signIn` return an unknown
reason, as the pending state was observed at T10. It was offered and not run, so it
stands as a **known limitation**: this behaviour is established by reading the
code, and by nothing else.

### R8 — Success state

| Criterion | Evidence | Status |
|---|---|---|
| Panel shows a confirmation and the signed-in email | CODE `ui.js:108–112` · SEEN in the targeted re-check (step 5) | PASS |
| Sign out returns to an empty, error-free form | CODE `initialState()` restores state `ui.js:247`; `form.reset()` empties the fields `ui.js:254` · SEEN in the targeted re-check (step 6) | PASS |
| Happens in place; the browser does not navigate | CODE `preventDefault()`, `ui.js:265`; no navigation API anywhere in `src/` · SEEN at the T12 pass, carried over | PASS |
| Nothing persisted; refresh returns to the form | CODE state is in memory only; no storage API anywhere in `src/` · SEEN in the targeted re-check (step 7), with both fields empty | PASS |
| Sign out resets values, errors and the password toggle | CODE the same `initialState()` that built the first state, plus `form.reset()` for the values · SEEN in the targeted re-check (step 6), with the password left visible beforehand | PASS |
| Focus moves to the email field after sign out | CODE `ui.js:258` · SEEN in the targeted re-check (step 6) | PASS |

### R9 — Visual design

| Criterion | Evidence | Status |
|---|---|---|
| Soft neutral background, white card, dark text | CODE tokens at `styles.css:13–28` · SEEN at the T12 pass, carried over | PASS |
| One accent, used for the primary button and focus rings | CODE `--accent`, `styles.css:24`; focus ring `:359` | PASS |
| System font stack; no web fonts | CODE `styles.css:68`; no `@font-face` or font import anywhere in `src/` | PASS |
| Visible focus ring on every interactive element | CODE one `:focus-visible` rule, `styles.css:359` · SEEN at the T12 pass, carried over | PASS |
| WCAG AA contrast | CALC — all 15 colour pairs pass; table below | PASS |

### R10 — Responsive behaviour

| Criterion | Evidence | Status |
|---|---|---|
| Usable from 320px to large desktop | CODE `max-width` and the narrow-screen rule, `styles.css:79`, `:88` · SEEN at the T12 pass, carried over | PASS |
| No horizontal page scrolling | CODE body side padding `styles.css:59`; long addresses wrap `:349` · SEEN at the T12 pass, carried over | PASS |
| Tap targets at least 44px tall | CODE inputs `styles.css:164`, the link `:249`, and buttons `:264` all use `--tap-target` — see F2 · SEEN at the T12 pass, carried over | PASS |

### R11 — Accessibility

| Criterion | Evidence | Status |
|---|---|---|
| Whole flow operable by keyboard alone, in a sensible order | SEEN at the T12 pass, carried over: keyboard-only pass | PASS |
| Enter submits from either input | CODE a real form with a real submit button · SEEN in the targeted re-check (step 4) | PASS |
| A real `<form>` and a real submit button | CODE `index.html:67`, `:133` | PASS |
| Errors and success are not conveyed by colour alone | CODE every error is written as text beside its red border · SEEN in the targeted re-check (step 2) | PASS |
| Errors and success are conveyed to assistive technology | CODE `role="alert"` `index.html:59`; live-region error slots `:90`, `:121`; `role="status"` `:153`; focus to the heading on success `ui.js:210` · no screen reader used | UNVERIFIED |

### R12 — Testable logic is separated

| Criterion | Evidence | Status |
|---|---|---|
| Pure functions in their own modules with no DOM access | CODE no `document`, `window`, `localStorage`, `sessionStorage`, `navigator` or `alert` in `validation.js` or `auth.js` — re-checked on this build | PASS |
| `node --test` passes with no installed dependencies | TEST 45 passing on this build; `package.json` declares no dependencies | PASS |
| `signIn` tested through both success and failure | TEST 15 cases in `tests/auth.test.js` | PASS |

### R13 — Pending state while signing in

| Criterion | Evidence | Status |
|---|---|---|
| Submit button disabled and relabelled | CODE `ui.js:102–103` · SEEN at T10 with a temporary delay | PASS |
| Inputs read-only for the duration | CODE `ui.js:100–101` · SEEN at T10 | PASS |
| A second submit cannot start | CODE guard at `ui.js:270`, plus the disabled button · SEEN at T10 | PASS |
| Form returns to normal on success and on failure | CODE `finally`, `ui.js:314` · SEEN at T10, both paths | PASS |
| Pending state announced to assistive technology | CODE `role="status"` region `index.html:153`, written at `ui.js:104` · no screen reader used | UNVERIFIED |

R13's first four rows rest on a browser observation made at T10. That holds for the
same reason the carried-over rows do: no later task changed the code that controls
them — the guard, the `finally`, and the read-only and disabled lines are identical
in the final build; only their line numbers moved.

---

## Contrast measurements

Computed from the WCAG 2.x relative-luminance formula by a script, for every
colour pair the page actually renders. Text needs 4.5:1; the boundary of a control
needs 3:1 (WCAG 1.4.11). Disabled controls are exempt and are not listed. The final
review changed no colour.

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
| `ui.js` at roughly 200 lines of code | 134 lines of code (330 in total), after the final-review fixes | Under |

---

## Browser checklist

The full procedure. After a change, repeat the parts of it the change could affect
— decided from the diff — and record which earlier results carried over and why,
as described in "How the final build was verified" above. Hard-refresh first
(**Ctrl+Shift+R**).

> **History.** Full pass of A–F on the T12 build, 2026-09-11. Targeted seven-step
> re-check of the final build, 2026-09-11, covering B, C, D and G: all passed.
> H and I have not been run.

**A. Keyboard only** — R3, R4, R9, R11
1. Tab from the top: Email → Password → Show → Forgot password? → Sign in.
2. Every stop shows a visible focus ring.
3. Space on Show toggles it; the label changes between Show and Hide.
4. Enter submits from inside either input.

**B. Validation** — R5, R6
1. Submit empty: both messages, both inputs red, focus on Email.
2. Type a valid email: its error clears while you type; the password error stays.
3. Clear the email again: no error returns until the next submit.
4. The gap between each input and the next field looks the same with and without a message showing.

**C. Credentials** — R7
1. `nobody@example.com` and anything: "Incorrect email" under email, focus there.
2. `demo@example.com` and a wrong password: "Incorrect password" under password.
3. After either, both fields still hold what you typed.
4. Type one character into the field in error: the message clears at once.

**D. Sign in and out** — R8
1. Sign in as `  DEMO@Example.COM  ` / `password123`: the panel shows `demo@example.com`, the address bar is unchanged.
2. Tab once: focus lands on Sign out.
3. Sign out: empty form, "Sign in" heading back, cursor in Email.
4. Cause an error, click Show, sign in, sign out: no error, password hidden, label reads Show, both fields empty.
5. Sign in, then refresh: back at the form.

**E. Narrow screen** — R1, R10
1. DevTools device toolbar at **320px**: the card fits and nothing scrolls sideways.
2. Repeat at 768px and full width: the card stays centred and never wider than about 400px.

**F. The T12 fixes** — R4, R10
1. Click Forgot password?: the address bar does not change (F1).
2. At 320px, hover the link with DevTools' element picker: its box is 44px tall (F2).

**G. Autofill survives** — F5
1. In the DevTools Console, fill both fields without firing any input event:
   ```js
   document.getElementById('email').value = 'demo@example.com';
   document.getElementById('password').value = 'password123';
   ```
2. Click **Show**: both fields keep their values.
3. Click at the end of the email, type a character, delete it: the password is still filled.
4. Click **Sign in**: you are signed in as `demo@example.com`.
5. Sign out: both fields are empty.

**H. Listen to it** — optional, F4 and every UNVERIFIED row
Windows Narrator: **Ctrl+Win+Enter** turns it on and off.
1. Type a valid email, Tab to the empty password field, press **Enter**: Narrator should say "Password is required".
2. Press Enter again: expected silence — the recorded limitation.
3. Enter a wrong password and press Enter inside the field: Narrator should say "Incorrect password".

If this is run, the four UNVERIFIED rows can be settled either way.

**I. See the generic failure message** — optional, R7
On request, a temporary change makes `signIn` return a reason the form does not
recognise; it is reverted before anything is committed, exactly as the delay was
at T10.
