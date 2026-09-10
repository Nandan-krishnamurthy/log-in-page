# ADR-0003 — Credential checking sits behind one async seam

**Status:** Accepted
**Date:** 2026-09-10

## Context

This version checks credentials against a hardcoded account in JavaScript. The
user intends to add a real backend in a later phase, as a second learning
project (see "Future direction" in `01-requirements.md`).

The expensive part of that migration is not the server. It is that a network call
is asynchronous and a hardcoded comparison is not. Code written against a
synchronous check assumes the answer is available immediately: the submit handler
returns a result inline, there is no in-flight window, nothing can fail in
transit. Making that code asynchronous later touches the submit handler, the
button state, the error handling and the success transition.

## Decision

All credential checking goes through one function:

```js
async function signIn(email, password)
// → { ok: true,  email }
// → { ok: false, reason: 'unknown_email' }
// → { ok: false, reason: 'incorrect_password' }
```

It is `async` from day one even though it does no I/O, and it returns a result
object rather than throwing or returning a boolean. The form awaits it and maps
`reason` to a field and a message. No other module knows how credentials are
verified.

R13's pending state exists to give that asynchrony somewhere to show.

## Consequences

- Adding a backend means rewriting the body of one function to call `fetch()`.
  The form, the validation, the pending state and the success state are
  untouched.
- Result objects rather than exceptions mean an expected failure — wrong password
  — is ordinary control flow, not an error path. Exceptions stay available for
  genuinely unexpected conditions, such as a future network failure.
- The `reason` codes, rather than display strings, mean the decision to collapse
  the two messages into one vague message later (the user-enumeration debt
  recorded in R7) becomes a change to how `ui.js` renders a result, not a change
  to the check.
- A trivially small amount of ceremony today — an `await` that never waits — in
  exchange for that.

## Alternatives considered

- **A synchronous `checkCredentials()` returning a boolean.** Simpler now,
  and it is what this version alone would justify. Rejected because the retrofit
  cost is concentrated in exactly the code that is most fiddly to change.
- **A pluggable auth-provider interface with configuration.** Rejected as
  speculative machinery for a system that does not exist. The principle applied
  here is to buy the one seam that is expensive to retrofit, and nothing more.
