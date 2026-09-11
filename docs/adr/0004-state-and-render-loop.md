# ADR-0004 — One state object and one render function

**Status:** Accepted
**Date:** 2026-09-10

## Context

This page has more states than it first appears: not yet submitted, showing
format errors, showing a credential error, request in flight, signed in, password
visible or hidden — and combinations of several at once.

The natural way to write it is for each event handler to change the DOM directly:
the submit handler disables the button, the response handler re-enables it and
writes an error, the input handler removes the error. This works until two
handlers disagree, at which point the page can display a state that no one
intended: a disabled button next to a cleared error, or a spinner that never
stops because the failure path forgot to re-enable it.

## Decision

`ui.js` holds one state object describing everything the page can be, and one
`render(state)` function that makes the DOM match it. Event handlers only change
state and call `render`. No handler modifies the DOM.

```
   event  →  update state  →  render(state)  →  DOM
```

`render` is written to be safe to call repeatedly and to set every property it
governs on every call — including back to its default — so that no stale
attribute survives a transition.

## Consequences

- Impossible states become impossible to display, because the DOM is derived
  rather than accumulated. The pending-state bugs R13 invites are structurally
  prevented rather than tested for.
- Reading `render` tells you everything the page can look like, in one place.
- It is more code than direct mutation would be for the first requirement, and
  less by about the fourth.
- Re-rendering the whole card on each change would normally raise questions about
  focus and about typing being interrupted. At this size `render` updates
  attributes and text on existing elements rather than rebuilding them, so it
  does not.
- This is the same idea frameworks implement, done by hand. It transfers directly
  if the project ever moves to one.

## Amended after the final review (F5)

The decision above described one state object holding "everything the page can
be", including the values typed into the two fields. The final review found that
this was wrong for exactly those values.

An input's value is not the page's to own. The person typing writes it, and so do
autofill, password managers and the browser restoring a form — and not all of
them fire the `input` event the page listened for. The copy in state went stale,
and because render made the fields match state, clicking Show or typing in the
other field erased credentials a password manager had just filled in. A first
fix, reading the fields on submit only, repaired the path that had been
reproduced and left the others broken.

So the state object no longer holds field values, render never writes into an
input, and code reads `el.email.value` and `el.password.value` directly when it
needs them. Sign out clears the fields with the form's own `reset()`: the one
place a handler touches the DOM, deliberately, because the values belong to the
browser rather than to state.

The general rule this records: keep in state what the page decides, not what the
browser or the user owns. A copy of someone else's state is a cache, and a cache
that gets written back is how data is lost.

## Alternatives considered

- **Direct DOM mutation in each handler.** Fewer lines for a form with two
  fields. Rejected because R13's in-flight window plus two independent error
  systems (R6 and R7) is precisely the combination that produces stale-state
  bugs.
- **A framework that provides this.** See ADR-0001.
