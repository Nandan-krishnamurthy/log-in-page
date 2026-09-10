# 01 — Requirements

**Status:** Draft, awaiting approval
**Station:** 1 (Intake)
**Date:** 2026-09-10

## Purpose

A single-page sign-in screen. Clean and minimal in the spirit of modern
authentication pages, with original wording, colours and layout — no copying of
any company's branding, logo, typeface or exact design.

This page is a learning vehicle for the AI Software Factory workflow. Scope is
kept deliberately small so that every station in the workflow can be exercised
end to end.

---

## Requirements

### R1 — Page layout

A single HTML page presenting one centred card on a plain background. The card
contains, top to bottom: a simple original wordmark, a heading, the email field,
the password field, a "Forgot password?" link, and the Sign in button.

**Acceptance criteria**
- The card is horizontally and vertically centred in the viewport.
- The card has a maximum width of roughly 400px and does not stretch on wide screens.
- No other page furniture (no navbar, no footer, no illustrations).

### R2 — Email field

A text input for the user's email address, with a visible label.

**Acceptance criteria**
- The input has a `<label>` that is programmatically associated with it.
- The input uses `type="email"` and `autocomplete="email"`.
- Leading and trailing whitespace is ignored when the value is checked.

### R3 — Password field with show/hide toggle

A password input with a visible label and a control that toggles the value
between hidden and visible.

**Acceptance criteria**
- The input has an associated `<label>` and uses `autocomplete="current-password"`.
- A toggle control switches the input between `type="password"` and `type="text"`.
- The toggle is reachable by keyboard and announces its current state to screen readers.
- The toggle does not submit the form when activated.

### R4 — "Forgot password?" link

A placeholder link beneath the password field.

**Acceptance criteria**
- The link is visible and keyboard-focusable.
- It performs no navigation in this version; this is explicitly a placeholder.

### R5 — Validation timing

Validation is quiet until the user first submits, then becomes live for any
field that is showing an error.

**Acceptance criteria**
- No error is shown before the first submit attempt.
- After a submit that produced errors, editing a field with an error re-checks
  that field on each input event and clears its error as soon as it is valid.
- Fields that are not showing an error are not validated on input.

### R6 — Field validation rules and inline errors

**Acceptance criteria**
- Email: required. Must be non-empty after trimming, contain exactly one `@`,
  have text before the `@`, and have a domain after the `@` containing at least
  one dot with characters either side. Anything else shows
  "Enter a valid email address"; an empty field shows "Email is required".
- Password: required, non-empty. An empty field shows "Password is required".
  No length or complexity rule is applied — strength rules belong on a sign-up
  form, not a sign-in form, where they would only help an attacker.
- Each message appears directly beneath its own field.
- The offending input is visually marked (border colour) and marked
  `aria-invalid="true"`, with the message linked via `aria-describedby`.
- On a failed submit, focus moves to the first field with an error.

### R7 — Credential check and failure message

Submitting a form that passes R6 checks the values against one hardcoded
demo account held in the JavaScript.

**Acceptance criteria**
- The demo account is `demo@example.com` / `password123`, defined in one clearly
  commented place and documented in the README as a learning stub.
- Email comparison ignores case and surrounding whitespace; password comparison
  is exact.
- Credential failures are reported separately, not merged into one message:
  - An email that does not match the demo account shows **"Incorrect email"**,
    inline beneath the email field.
  - An email that matches but a password that does not shows
    **"Incorrect password"**, inline beneath the password field.
- Only one credential message is shown at a time. The email is checked first; if
  it does not match, the password is not evaluated and no password message appears.
- Credential messages are distinct from the R6 format-validation messages and
  never replace them. R6 messages describe malformed input; R7 messages describe
  input that is well-formed but wrong. They use the same inline slot beneath each
  field and the same styling, but are produced by different logic.
- Credential messages are announced to screen readers when they appear, and are
  attached to their field with `aria-describedby` / `aria-invalid` exactly as
  R6 messages are.
- Neither field is cleared on failure.
- The check is reached through a single `async function signIn(email, password)`
  that resolves to a plain result object:
  `{ ok: true, email }`, `{ ok: false, reason: 'unknown_email' }`, or
  `{ ok: false, reason: 'incorrect_password' }`. The form maps the `reason` to a
  field and a message; it does not itself know how credentials are verified.
  This boundary exists so that a real server call can replace the hardcoded check
  later without the form code changing — see "Future direction".

> **Recorded decision — user enumeration.** Separate "Incorrect email" and
> "Incorrect password" messages are more helpful to the person signing in, and
> are what the user asked for. They are also what lets an attacker discover which
> email addresses have accounts, by watching which of the two messages comes back.
> Most production sign-in forms therefore use one deliberately vague message.
>
> For this version the trade is accepted knowingly: there is a single hardcoded
> fake account, no real users, and no data behind the form, so there is nothing to
> enumerate. This decision must be revisited before any real user data sits behind
> a login — see "Future direction".

### R8 — Success state

Correct credentials replace the form with a signed-in panel inside the same card.

**Acceptance criteria**
- The panel shows a confirmation and the email that was signed in with.
- A "Sign out" button returns the card to an empty, error-free form.
- The transition happens in place; the browser does not navigate.
- Nothing is persisted; a page refresh returns to the signed-out form.

### R9 — Visual design

Light theme with a single accent colour.

**Acceptance criteria**
- Soft neutral page background, white card, dark neutral text.
- One accent colour used for the primary button and focus rings.
- System font stack; no web fonts to download.
- Every interactive element has a clearly visible focus ring.
- Text and interface colours meet WCAG AA contrast (4.5:1 for body text).

### R10 — Responsive behaviour

**Acceptance criteria**
- Usable from 320px wide up to large desktop screens.
- No horizontal page scrolling at any width.
- Tap targets are at least 44px tall on small screens.

### R11 — Accessibility

**Acceptance criteria**
- The whole flow is operable by keyboard alone, in a sensible tab order.
- Enter submits the form from either input.
- The form uses a real `<form>` element with a real submit button.
- Error messages and the success state are conveyed to assistive technology,
  not by colour alone.

### R12 — Testable logic is separated

Validation and credential-checking logic live in their own module so they can be
tested without a browser.

**Acceptance criteria**
- Pure functions for email validation, required-field checks and credential
  checking sit in a separate file with no DOM access.
- `node --test` runs against them and passes, with no installed dependencies.
- The `signIn` boundary from R7 lives in its own module and is tested through
  both its success and failure paths.

### R13 — Pending state while signing in

Because `signIn` is asynchronous, the form handles the window between submit and
result. Added in anticipation of a real backend, where that window is real.

**Acceptance criteria**
- While a sign-in is in flight the submit button is disabled and its label
  changes to indicate work in progress.
- Both inputs are made read-only for the duration so the values cannot change
  underneath the request.
- A second submit cannot be started while one is in flight.
- On completion, whether success or failure, the form returns to its normal
  interactive state.
- The pending state is announced to assistive technology.

---

## Out of scope

Stated explicitly so nobody builds them by accident:

- Any real backend, database, session, cookie or token. **Deferred, not
  rejected** — see "Future direction" below.
- Real password security of any kind. The demo credential is a visible stub.
- Sign-up, password reset, email verification, social or single sign-on flows.
- "Remember me" or any persistence across refreshes.
- Rate limiting, CAPTCHA, or any anti-abuse measure.
- Dark mode, animation beyond simple state changes, internationalisation.
- Any build step, package manager, framework or third-party dependency.

## Future direction

The user intends to add a real backend in a later phase, as a second learning
project. This version must therefore not paint that in a corner. Two constraints
follow, and they are the only concessions made to it:

1. The `async signIn()` boundary in R7. Adding a server later means rewriting the
   body of one function to call `fetch()`; the form, the validation and the
   success state are untouched.
2. The pending state in R13, so that a real network delay has somewhere to show.

Everything else stays as simple as it would be without the future plan. We are
buying one seam, not building a framework for a system that does not exist yet.
The backend itself — session handling, password hashing, real error codes — is a
separate spec written when that phase starts.

A third item is not a concession but a debt to settle at that point: the separate
"Incorrect email" / "Incorrect password" messages from R7. Once real accounts
exist, those two messages let an attacker enumerate which email addresses are
registered. The backend spec must decide deliberately whether to collapse them
into one vague message. The `reason` codes returned by `signIn` make that a
change to how the form renders a result, not a change to the check itself.

## Definition of done for the project

All acceptance criteria above are met, `node --test` passes, the page has been
opened and exercised by hand in a browser at both desktop and phone width, the
diff has been reviewed, and the work is committed and pushed to GitHub.

## Open questions

None. The earlier question about where a wrong-credentials message should sit was
resolved by the R7 revision: because the messages are now specific to a field,
each one sits inline beneath the field it refers to, consistent with R6.
