/**
 * Tests for src/validation.js (R6, R12).
 *
 * Every R6 clause has at least one case. Cases assert against the exported
 * message constants rather than literal strings, so a wording change fails in
 * one place instead of a dozen — but note that the constants themselves are the
 * wording R6 specifies, so changing them is a requirements change, not a
 * refactor.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateEmail,
  validatePassword,
  validateForm,
  EMAIL_REQUIRED,
  EMAIL_INVALID,
  PASSWORD_REQUIRED,
} from '../src/validation.js';

// R6 specifies the exact wording of all three messages. Asserting against the
// constants everywhere else keeps the suite readable, but it would not notice a
// constant drifting away from the requirement, because both sides of the
// comparison would move together. So the literal text is pinned here, once.
describe('message wording (R6)', () => {
  it('matches the requirement exactly', () => {
    assert.equal(EMAIL_REQUIRED, 'Email is required');
    assert.equal(EMAIL_INVALID, 'Enter a valid email address');
    assert.equal(PASSWORD_REQUIRED, 'Password is required');
  });
});

describe('validateEmail', () => {
  describe('required', () => {
    it('rejects an empty string', () => {
      assert.equal(validateEmail(''), EMAIL_REQUIRED);
    });

    it('rejects whitespace only, because it is empty once trimmed', () => {
      assert.equal(validateEmail('   '), EMAIL_REQUIRED);
    });

    it('treats a missing value as missing rather than throwing', () => {
      assert.equal(validateEmail(undefined), EMAIL_REQUIRED);
      assert.equal(validateEmail(null), EMAIL_REQUIRED);
    });
  });

  describe('whitespace inside the address', () => {
    // The case that was legal under R6 as originally written, and that the
    // amendment at T2 exists to reject.
    it('rejects a space in the local part', () => {
      assert.equal(validateEmail('a b@c.com'), EMAIL_INVALID);
    });

    it('rejects a space in the domain', () => {
      assert.equal(validateEmail('a@c d.com'), EMAIL_INVALID);
    });

    it('rejects a tab anywhere inside', () => {
      assert.equal(validateEmail('a\tb@c.com'), EMAIL_INVALID);
    });
  });

  describe('the @ separator', () => {
    it('rejects an address with no @', () => {
      assert.equal(validateEmail('nandan'), EMAIL_INVALID);
    });

    it('rejects an address with two @', () => {
      assert.equal(validateEmail('a@@b.com'), EMAIL_INVALID);
      assert.equal(validateEmail('a@b@c.com'), EMAIL_INVALID);
    });

    it('rejects an address with nothing before the @', () => {
      assert.equal(validateEmail('@b.com'), EMAIL_INVALID);
    });
  });

  describe('the domain', () => {
    it('rejects a domain with no dot', () => {
      assert.equal(validateEmail('a@b'), EMAIL_INVALID);
    });

    it('rejects a dot at the start of the domain', () => {
      assert.equal(validateEmail('a@.com'), EMAIL_INVALID);
    });

    it('rejects a dot at the end of the domain', () => {
      assert.equal(validateEmail('a@b.'), EMAIL_INVALID);
    });

    it('rejects consecutive dots, which leave an empty label', () => {
      assert.equal(validateEmail('a@b..c'), EMAIL_INVALID);
    });

    it('rejects an empty domain', () => {
      assert.equal(validateEmail('a@'), EMAIL_INVALID);
    });
  });

  describe('addresses that should pass', () => {
    it('accepts a plain address', () => {
      assert.equal(validateEmail('demo@example.com'), null);
    });

    it('accepts a short but well-formed address', () => {
      assert.equal(validateEmail('a@b.c'), null);
    });

    it('accepts a subdomain', () => {
      assert.equal(validateEmail('demo@mail.example.co.uk'), null);
    });

    it('accepts surrounding whitespace, which is trimmed', () => {
      assert.equal(validateEmail('  demo@example.com  '), null);
    });

    it('accepts uppercase, which is not the validator’s concern', () => {
      assert.equal(validateEmail('DEMO@EXAMPLE.COM'), null);
    });
  });
});

describe('validatePassword', () => {
  it('rejects an empty string', () => {
    assert.equal(validatePassword(''), PASSWORD_REQUIRED);
  });

  it('treats a missing value as missing rather than throwing', () => {
    assert.equal(validatePassword(undefined), PASSWORD_REQUIRED);
    assert.equal(validatePassword(null), PASSWORD_REQUIRED);
  });

  // Deliberate: the value is never trimmed. A password of spaces is a real
  // password, and quietly altering what someone typed produces a sign-in that
  // fails for reasons they cannot see.
  it('accepts a single space, because passwords are not trimmed', () => {
    assert.equal(validatePassword(' '), null);
  });

  it('accepts a single character, because there is no length rule', () => {
    assert.equal(validatePassword('x'), null);
  });

  it('accepts an ordinary password', () => {
    assert.equal(validatePassword('password123'), null);
  });
});

describe('validateForm', () => {
  it('reports both fields when both are missing', () => {
    assert.deepEqual(validateForm({ email: '', password: '' }), {
      email: EMAIL_REQUIRED,
      password: PASSWORD_REQUIRED,
    });
  });

  it('reports only the field that is wrong', () => {
    assert.deepEqual(validateForm({ email: 'nope', password: 'password123' }), {
      email: EMAIL_INVALID,
      password: null,
    });
  });

  it('returns null for both when the form is valid', () => {
    assert.deepEqual(
      validateForm({ email: 'demo@example.com', password: 'password123' }),
      { email: null, password: null },
    );
  });

  // ADR-0004: render sets every property it governs on every call, including
  // back to null. That only works if validateForm always returns both keys.
  it('always returns both keys, so state can be assigned without merging', () => {
    assert.deepEqual(Object.keys(validateForm({})).sort(), ['email', 'password']);
    assert.deepEqual(Object.keys(validateForm(undefined)).sort(), ['email', 'password']);
  });

  it('survives being called with nothing at all', () => {
    assert.deepEqual(validateForm(undefined), {
      email: EMAIL_REQUIRED,
      password: PASSWORD_REQUIRED,
    });
  });
});
