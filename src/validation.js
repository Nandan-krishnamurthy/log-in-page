/**
 * Format validation for the sign-in form (R6).
 *
 * Pure by design: no DOM, no globals, no side effects. See ADR-0002 — that rule
 * is what lets these functions run under `node --test` with nothing installed.
 *
 * Every function returns `null` when the value is acceptable, or the exact
 * message string from R6 when it is not.
 *
 * These checks are a convenience, not a control. They provide no security
 * whatsoever — a browser can be made to send any values at all. When a server
 * exists, every rule here must be enforced again on the server, which is the
 * only authoritative check (R6).
 */

export const EMAIL_REQUIRED = 'Email is required';
export const EMAIL_INVALID = 'Enter a valid email address';
export const PASSWORD_REQUIRED = 'Password is required';

/**
 * R6: required; no whitespace once trimmed; exactly one `@`; text before it; a
 * domain after it made of at least two non-empty dot-separated labels.
 *
 * Deliberately simple, and it will reject some technically valid but exotic
 * addresses. That trade is recorded in the plan's risk table: a rule nobody can
 * read is worse than a rule that is slightly too strict, because an address the
 * page wrongly rejects is visible immediately, while an unreadable rule is wrong
 * forever.
 *
 * @param {unknown} raw
 * @returns {string|null} the R6 message, or null when valid
 */
export function validateEmail(raw) {
  const value = String(raw ?? '').trim();

  if (value === '') return EMAIL_REQUIRED;

  // Checked after trimming, so the space inside "a b@c.com" is rejected while
  // the surrounding spaces in " demo@example.com " are not.
  if (/\s/.test(value)) return EMAIL_INVALID;

  const parts = value.split('@');
  if (parts.length !== 2) return EMAIL_INVALID; // none, or more than one

  const [local, domain] = parts;
  if (local === '') return EMAIL_INVALID;

  // Splitting on '.' catches three cases at once: no dot at all (one label), a
  // dot at either edge (an empty first or last label), and consecutive dots
  // (an empty label in the middle).
  const labels = domain.split('.');
  if (labels.length < 2) return EMAIL_INVALID;
  if (labels.some((label) => label === '')) return EMAIL_INVALID;

  return null;
}

/**
 * R6: required only. No length or complexity rule — strength belongs on a
 * sign-up form, where it protects the account being created. On a sign-in form
 * it protects nothing and only tells an attacker what shape to guess.
 *
 * Note what is missing: the value is not trimmed. A password made of spaces is a
 * legitimate password, and silently altering what someone typed before comparing
 * it produces a sign-in that fails for reasons the user cannot see.
 *
 * @param {unknown} raw
 * @returns {string|null} the R6 message, or null when valid
 */
export function validatePassword(raw) {
  const value = String(raw ?? '');

  if (value === '') return PASSWORD_REQUIRED;

  return null;
}

/**
 * Validates both fields together. Always returns both keys, so a caller can
 * assign the result straight into state without merging (ADR-0004: render sets
 * every property it governs on every call, including back to null).
 *
 * @param {{ email?: unknown, password?: unknown }} values
 * @returns {{ email: string|null, password: string|null }}
 */
export function validateForm(values) {
  return {
    email: validateEmail(values?.email),
    password: validatePassword(values?.password),
  };
}
