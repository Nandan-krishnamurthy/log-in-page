/**
 * The credential seam (R7, ADR-0003).
 *
 * This module is the entire boundary between this page and wherever credentials
 * actually live. Nothing else in the codebase knows how a sign-in is verified.
 * Replacing the body of `signIn` with a `fetch()` is the whole of the future
 * backend migration on the client side.
 *
 * Pure of the DOM, like validation.js, so it runs under `node --test` with
 * nothing installed (ADR-0002).
 */

/**
 * The one account this version accepts.
 *
 * This is a stub, not a credential. It is plain text in a file served to every
 * visitor, so anyone can read it with two clicks. Nothing is protected by this
 * form, and nothing should ever be placed behind it. A real implementation
 * stores a salted hash from argon2id or bcrypt, on a server, and never sends it
 * anywhere.
 */
export const DEMO_ACCOUNT = {
  email: 'demo@example.com',
  password: 'password123',
};

/**
 * Checks credentials and resolves to a result object. Expected failures are
 * ordinary return values rather than thrown errors — a wrong password is not an
 * exceptional condition, it is one of the things this function is for. That
 * leaves exceptions free to mean something genuinely unexpected later, such as a
 * network that is not there.
 *
 * `async` from day one, even though nothing here waits on anything (ADR-0003).
 * The asynchrony is the point: it is what makes the caller's shape correct
 * before a real request ever exists.
 *
 * @param {unknown} email
 * @param {unknown} password
 * @returns {Promise<{ok: true, email: string} | {ok: false, reason: 'unknown_email' | 'incorrect_password'}>}
 */
export async function signIn(email, password) {
  // Matched case-insensitively after trimming, because an email address is the
  // same address however it is typed (R7).
  const submittedEmail = String(email ?? '').trim().toLowerCase();

  // Checked first, and it short-circuits: `incorrect_password` is only ever
  // returned for an email that exists (R7).
  //
  // On a real server this ordering leaks the same information as the two
  // separate messages do, and it leaks it through response timing even if the
  // messages are made identical. Settling that is part of the debt R7 records
  // against the backend phase; here there is one fake account and nothing to
  // enumerate.
  if (submittedEmail !== DEMO_ACCOUNT.email.toLowerCase()) {
    return { ok: false, reason: 'unknown_email' };
  }

  // Compared exactly. Not trimmed, not case-folded: a password is the literal
  // bytes someone typed (R7).
  if (String(password ?? '') !== DEMO_ACCOUNT.password) {
    return { ok: false, reason: 'incorrect_password' };
  }

  // The account's own address is returned rather than whatever was typed, so
  // the signed-in panel shows one canonical form. Typing "DEMO@Example.com "
  // signs you in and the page says demo@example.com. This is also what a real
  // server would return, since it answers from its own record rather than from
  // the request.
  return { ok: true, email: DEMO_ACCOUNT.email };
}
