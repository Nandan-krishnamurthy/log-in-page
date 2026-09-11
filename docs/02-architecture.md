# 02 — Architecture

**Status:** Approved
**Station:** 2 (Architecture)
**Depends on:** `01-requirements.md` (approved)
**Date:** 2026-09-10

## Shape of the thing

Three source files with a strict one-way dependency, plus tests that never touch
a browser.

```
                 ┌──────────────┐
                 │  index.html  │   structure only
                 └──────┬───────┘
                        │ loads
                 ┌──────▼───────┐
                 │    ui.js     │   the only file that touches the DOM
                 └──┬────────┬──┘
                    │        │
        ┌───────────▼──┐  ┌──▼───────────┐
        │ validation.js│  │   auth.js    │   no DOM, no globals
        └──────────────┘  └──────────────┘
                    ▲        ▲
                    └────┬───┘
                    tests/ run these two directly under `node --test`
```

**The dependency rule, in one line:** `ui.js` may import from `validation.js` and
`auth.js`; neither of them may import from `ui.js` or reference `document`,
`window`, or any DOM type. Nothing imports `ui.js`.

That rule is what makes the logic testable in Node with zero dependencies. It is
the single most load-bearing decision in this document — see
[ADR-0002](adr/0002-dom-free-logic-modules.md).

## File layout

```
log-in-page/
├── CLAUDE.md
├── package.json           { "type": "module" } only — no dependencies
├── README.md              what it is, how to run it, the demo credential
├── docs/
│   ├── 01-requirements.md
│   ├── 02-architecture.md
│   ├── 03-plan.md
│   └── adr/0001..0005-*.md
├── src/
│   ├── index.html
│   ├── styles.css
│   ├── validation.js      pure format checks           (R6)
│   ├── auth.js            the signIn seam + demo account (R7)
│   └── ui.js              state, render, event wiring   (R1-R5, R8-R13)
└── tests/
    ├── validation.test.js
    └── auth.test.js
```

## Module contracts

### `validation.js` — pure, synchronous

```js
validateEmail(raw)     // → null | "Email is required" | "Enter a valid email address"
validatePassword(raw)  // → null | "Password is required"
validateForm(values)   // → { email: null|string, password: null|string }
```

`null` means valid. Returning the message string rather than an error code keeps
this version simple; if the page ever needs translating, these become codes and
the mapping moves to `ui.js`. Not needed now (R12 out-of-scope: no i18n).

### `auth.js` — the seam

```js
const DEMO_ACCOUNT = { email: 'demo@example.com', password: 'password123' }

async function signIn(email, password)
// → { ok: true,  email }
// → { ok: false, reason: 'unknown_email' }
// → { ok: false, reason: 'incorrect_password' }
```

Email compared case-insensitively after trimming; password compared exactly.
Email is checked first and short-circuits, so `incorrect_password` is only ever
returned for an email that exists (R7).

This function is the entire boundary between "this page" and "wherever
credentials actually live". Replacing its body with a `fetch()` is the whole of
the future backend migration on the client side — see
[ADR-0003](adr/0003-async-signin-seam.md).

### `ui.js` — state and render

All page behaviour flows one way:

```
   event  →  update state  →  render(state)  →  DOM
     ▲                                            │
     └──────────────── user acts ─────────────────┘
```

There is one state object and one `render()` that makes the DOM match it.
Handlers never poke at the DOM directly.

```js
{
  errors:          { email: null, password: null },   // message or null
  formMessage:     null,    // a failure belonging to neither field     (R7)
  pending:         false,   // a signIn call is in flight               (R13)
  passwordVisible: false,   //                                          (R3)
  session:         null     // { email } once signed in                 (R8)
}
```

> **Amended at T9.** This listing originally included `submitted: false`, a flag
> recording whether submit had been attempted, which R5 appeared to need.
> Implementing R5 showed that it does not. "Is this field showing an error?"
> answers the same question in every case, because only a submit can create an
> error in the first place. The flag would have been state that was written and
> never read — exactly the kind of value that drifts out of step with the thing it
> claims to track. It was removed from the code, and this document was corrected
> to match, rather than the code being bent to match the document.
>
> **Amended after the final review.** Two further changes. `values` is gone:
> field values belong to the browser — autofill and password managers write them
> without always firing an event — so a copy here went stale and render, writing
> it back, erased real input (F5; see the ADR-0004 amendment). And `formMessage`,
> added to the code at T10 for the generic failure, was never added here; this
> listing had drifted from the code for two phases without anyone noticing.

Why bother, on a form this small? Because the alternative — each handler
mutating the DOM in place — is how forms end up in impossible states: a spinner
still spinning next to an error message, a disabled button that never
re-enables. With one render path, a state that cannot be described cannot be
displayed. See [ADR-0004](adr/0004-state-and-render-loop.md).

## Submit flow

```
submit
  └─ preventDefault()                 ← the browser must never GET this form
     ├─ validateForm(values)          ← R6, synchronous, format only
     │    └─ any errors? → render, focus first invalid field, stop
     └─ pending = true → render       ← R13: button disabled, inputs read-only
        └─ await signIn(...)          ← R7, the seam
           ├─ ok                 → session = { email }
           ├─ unknown_email      → errors.email    = 'Incorrect email'
           ├─ incorrect_password → errors.password = 'Incorrect password'
           └─ anything else      → generic message (default branch)
              └─ finally: pending = false → render
```

Format checks (R6) always run before credential checks (R7), so the two error
systems can never contend for the same slot in a single pass.

Two details in that diagram are deliberate. `pending = false` sits in a `finally`,
so no outcome — including one nobody anticipated — can leave the form stuck
disabled. And the mapping has a `default` branch, so an unrecognised `reason`
produces a vague message rather than silence. Both cost a line each now and exist
because a real server will eventually return things this version cannot.

## Testing strategy

| Layer | How it is tested | Why |
|---|---|---|
| `validation.js` | `node --test` | Pure functions, many cases, fast |
| `auth.js` | `node --test` | Both failure reasons and the success path |
| `ui.js` | By hand, against R1–R13 acceptance criteria | Testing DOM wiring without a browser needs tooling we deliberately do not have |

This split is the practical payoff of the dependency rule: the logic most likely
to be wrong is the logic that is cheapest to test. `ui.js` stays thin enough that
reading it is a reasonable substitute for automating it, at this size.

## How it runs

ES modules cannot be loaded from `file://` — the browser blocks them. The page
must be served over HTTP:

```
python -m http.server 8000 --directory src
```

then open `http://localhost:8000`. Python 3.12.6 and Node v24.12.0 are both
confirmed present on this machine. See
[ADR-0005](adr/0005-es-modules-and-local-server.md).

Tests: `node --test` from the repository root.

## Traceability

| Requirement | Lives in |
|---|---|
| R1 layout, R9 visual, R10 responsive | `index.html`, `styles.css` |
| R2 email field, R3 password + toggle, R4 forgot link | `index.html`, `ui.js` |
| R5 validation timing | `ui.js` |
| R6 format rules and messages | `validation.js` (+ `ui.js` to display) |
| R7 credential check and messages | `auth.js` (+ `ui.js` to display) |
| R8 success state, R13 pending state | `ui.js` |
| R11 accessibility | `index.html`, `ui.js` |
| R12 testable logic separated | the dependency rule, `tests/` |

## Gaps found in the requirements while designing this

Designing forces questions the spec did not answer. Three surfaced, each
resolved here and needing your confirmation:

1. **Does typing clear a credential error?** R5 covers re-validating *format*
   errors. It says nothing about the R7 messages. Decision: yes — editing a field
   makes "Incorrect email" stale, so any error on a field clears as soon as that
   field is edited, whatever produced it.
2. **Where does focus go after Sign out?** R8 does not say. Decision: to the
   email field, which is where the user will type next.
3. **What clears on Sign out?** R8 says the form returns "empty and error-free".
   Decision: values, errors and `passwordVisible` all reset — the card returns
   to a genuinely first-visit state. *(This originally also listed a `submitted`
   flag, removed at T9. Clearing the errors is what makes validation quiet
   again.)*

None of these change the acceptance criteria; they fill holes in them. If you
approve, they are folded into R5 and R8 as clarifications.
