# ADR-0002 — Logic modules must not touch the DOM

**Status:** Accepted
**Date:** 2026-09-10

## Context

R12 requires that validation and credential-checking logic be testable without a
browser, under `node --test`, with no installed dependencies.

Node has no DOM. Any module that reads `document`, `window`, or an input's
`.value` cannot be imported by a test file — it throws on load. Testing such code
requires a simulated DOM, which is a dependency, which ADR-0001 rules out.

The usual shape of a hand-written form does exactly the forbidden thing: a
`validate()` function that reaches into the page for its values and writes error
text back into the page.

## Decision

`validation.js` and `auth.js` are pure: they receive plain values as arguments
and return plain values. They import nothing from the page, reference no browser
global, and produce no side effects.

`ui.js` is the only module permitted to touch the DOM. It reads values out of
the page, passes them in, and renders what comes back. Nothing imports `ui.js`.

## Consequences

- The logic most likely to contain a bug — the email rules, the credential
  comparison, the two failure reasons — is covered by fast automated tests.
- `ui.js` cannot be unit-tested without tooling we do not have, and is verified
  by hand against the acceptance criteria instead. The dependency rule keeps it
  thin enough for that to be reasonable.
- Error *messages* currently live in `validation.js`, which is a small impurity
  of concern rather than of function. Acceptable while there is one language;
  ADR-0001's reasoning applies — solve it when it is real.
- Adding a backend later does not disturb this: `auth.js` becomes async I/O but
  stays DOM-free.

## Alternatives considered

- **jsdom or happy-dom** to simulate a browser in tests. Rejected: it is a
  dependency, and it would let the logic keep reaching into the DOM, which is the
  habit this decision exists to prevent.
- **Testing everything by hand.** Rejected: the validation rules have enough
  edge cases (R6) that hand-checking them on every change is exactly the work
  automation should absorb.
