// Temporary. Proves the test runner works before anything depends on it.
// Deleted in T3, once validation.test.js gives the runner real work to do.
//
// It exists because `node --test` exits with a failure when it finds no test
// files at all, so T1 needs at least one for its done-when to be reachable.

import { test } from 'node:test';
import assert from 'node:assert/strict';

test('the test runner runs', () => {
  assert.equal(1, 1);
});
