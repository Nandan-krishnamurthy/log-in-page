/**
 * Tests for src/auth.js (R7, R12).
 *
 * Covers all three result shapes, the comparison rules, and the contract the
 * form depends on. The short-circuit case matters most: a wrong email must
 * never produce `incorrect_password`, whatever password accompanies it.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { signIn, DEMO_ACCOUNT } from '../src/auth.js';

describe('signIn', () => {
  describe('success', () => {
    it('accepts the demo account', async () => {
      assert.deepEqual(await signIn(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password), {
        ok: true,
        email: DEMO_ACCOUNT.email,
      });
    });

    it('ignores surrounding whitespace on the email', async () => {
      const result = await signIn('  demo@example.com  ', 'password123');
      assert.equal(result.ok, true);
    });

    it('ignores the case of the email', async () => {
      const result = await signIn('DEMO@EXAMPLE.COM', 'password123');
      assert.equal(result.ok, true);
    });

    // The page shows this address in the signed-in panel (R8), so it must be the
    // canonical one rather than whatever was typed.
    it('returns the canonical address, not the submitted one', async () => {
      const result = await signIn('  DEMO@Example.COM  ', 'password123');
      assert.equal(result.email, 'demo@example.com');
    });
  });

  describe('unknown email', () => {
    it('rejects an address that is not the demo account', async () => {
      assert.deepEqual(await signIn('nobody@example.com', 'password123'), {
        ok: false,
        reason: 'unknown_email',
      });
    });

    // The invariant that keeps R7 from leaking an extra bit: the password is
    // never evaluated for an email that does not exist, so a correct password
    // cannot confirm anything about a wrong address.
    it('returns unknown_email even when the password is correct', async () => {
      const result = await signIn('nobody@example.com', DEMO_ACCOUNT.password);
      assert.equal(result.reason, 'unknown_email');
    });

    it('rejects an empty email', async () => {
      const result = await signIn('', 'password123');
      assert.equal(result.reason, 'unknown_email');
    });

    it('treats a missing email as unknown rather than throwing', async () => {
      assert.equal((await signIn(undefined, undefined)).reason, 'unknown_email');
      assert.equal((await signIn(null, null)).reason, 'unknown_email');
    });
  });

  describe('incorrect password', () => {
    it('rejects a wrong password for a known email', async () => {
      assert.deepEqual(await signIn('demo@example.com', 'wrong'), {
        ok: false,
        reason: 'incorrect_password',
      });
    });

    it('rejects an empty password', async () => {
      const result = await signIn('demo@example.com', '');
      assert.equal(result.reason, 'incorrect_password');
    });

    // Passwords are compared exactly: not case-folded...
    it('is case sensitive', async () => {
      const result = await signIn('demo@example.com', 'Password123');
      assert.equal(result.reason, 'incorrect_password');
    });

    // ...and not trimmed, unlike the email.
    it('does not trim the password', async () => {
      const result = await signIn('demo@example.com', ' password123 ');
      assert.equal(result.reason, 'incorrect_password');
    });
  });

  describe('the contract the form depends on', () => {
    // ADR-0003: async from day one, so the caller awaits a promise today and
    // still awaits a promise the day this becomes a network request.
    it('returns a promise', () => {
      assert.ok(signIn('demo@example.com', 'password123') instanceof Promise);
    });

    it('carries no email on a failure result', async () => {
      const unknown = await signIn('nobody@example.com', 'x');
      const wrongPassword = await signIn('demo@example.com', 'x');
      assert.equal('email' in unknown, false);
      assert.equal('email' in wrongPassword, false);
    });

    it('only ever returns the three documented reasons', async () => {
      const results = await Promise.all([
        signIn('demo@example.com', 'password123'),
        signIn('demo@example.com', 'wrong'),
        signIn('nobody@example.com', 'wrong'),
      ]);
      assert.deepEqual(
        results.map((r) => (r.ok ? 'ok' : r.reason)),
        ['ok', 'incorrect_password', 'unknown_email'],
      );
    });
  });
});
