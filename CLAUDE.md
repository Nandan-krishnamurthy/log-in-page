# log-in-page

A simple, clean login page. This project is a learning exercise for operating an
AI Software Factory — a repeatable, station-by-station way of building software.
The workflow matters more than the product.

## Tech stack

- Plain HTML, CSS, and vanilla JavaScript. No frameworks, no build step, no npm dependencies.
- Tests use Node's built-in runner (`node --test`).
- Source in `src/`, tests in `tests/`, factory documents in `docs/`.

## Working rules

1. Never write code before an approved requirement exists in `docs/01-requirements.md`.
2. Work one task at a time from `docs/03-plan.md`. Stop after each task for review.
3. Every commit message references the task and requirement it satisfies (e.g. `T4 / R2`).
4. Recommend, don't decide. Present options with a recommendation; the user chooses.
5. Stop at every station gate and wait for approval before moving to the next station.
6. When the user corrects something, propose adding a rule here so it does not recur.

## Git workflow

- Never commit directly to `main`. All work happens on a branch.
- One branch per station or task group, named `docs/...`, `feat/...`, `test/...`,
  `fix/...` or `chore/...`.
- Branches reach `main` through a pull request, never a direct push.
- `main` holds only the scaffold root commit until the first pull request merges.

## Definition of done (per task)

- Acceptance criteria for the requirement are met.
- Tests pass, if the task has testable logic.
- The page has been opened in a browser and visually checked.
- The user has approved the diff.
- Changes are committed.
