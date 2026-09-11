# ADR-0001 — No framework and no build step

**Status:** Accepted
**Date:** 2026-09-10

## Context

This project exists to teach the AI Software Factory workflow. The login page is
the vehicle, not the goal. Any time spent on tooling is time not spent on the
stations.

A framework such as React, plus a bundler, would mean `npm install`, a
`node_modules` directory, a dev server, a config file, and a build step — before
a single field renders. It would also mean that when something breaks, the
question "is this my bug or my toolchain?" has to be answered first.

## Decision

Plain HTML, CSS and vanilla JavaScript. No framework, no bundler, no CSS
library, no third-party dependency of any kind.

The one `package.json` in the repository declares `{ "type": "module" }` and
nothing else. It has no dependencies and installs nothing.

## Consequences

- Every file in `src/` can be read top to bottom by a beginner with no framework
  knowledge.
- Nothing to install, so nothing to break, and the repository works on any
  machine with a browser.
- We write our own DOM wiring, which a framework would have handled. At this size
  that is roughly one small file — an acceptable trade, and instructive in its
  own right.
- If this page ever grew into a real multi-screen application, this decision
  would need revisiting. That would be a new ADR, not an edit to this one.

## Alternatives considered

- **React + Vite.** The industry default, and the right answer for a real
  product. Rejected here because the setup and concepts would dominate a project
  whose subject is the workflow.
- **A CSS framework such as Tailwind.** Rejected for the same reason, and because
  hand-writing the CSS makes the accessibility requirements (R9, R11) explicit
  rather than inherited.
