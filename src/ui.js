/**
 * State, rendering and event wiring (ADR-0004).
 *
 * This is the only module that touches the DOM. `validation.js` and `auth.js`
 * stay pure so they can be tested in Node; the cost of that rule is paid here,
 * in this file, and nowhere else (ADR-0002).
 *
 * Everything flows one way:
 *
 *     event  →  change state  →  render(state)  →  DOM
 *
 * Handlers never touch the DOM directly. If a handler wants the page to look
 * different, it changes state and calls render. That is the whole discipline,
 * and it is what stops the page reaching a combination nobody designed — a
 * spinner still spinning beside a cleared error, a button disabled forever.
 */

import { validateForm, validateEmail, validatePassword } from './validation.js';
import { signIn } from './auth.js';

/**
 * Everything the page can be. One object, so there is one place to look.
 *
 * There is no `submitted` flag. The architecture originally listed one; see its
 * T9 amendment, and the input handlers below. "Is this field currently showing
 * an error?" answers the same question R5 asks, so the flag would be state that
 * nothing reads.
 */
const state = {
  values: { email: '', password: '' },
  errors: { email: null, password: null }, // message string, or null
  formMessage: null, // a failure that belongs to neither field (R7)
  pending: false, // a sign-in is in flight (R13)
  passwordVisible: false, // (R3)
  session: null, // { email } once signed in (R8)
};

const el = {
  form: document.getElementById('signin-form'),
  email: document.getElementById('email'),
  emailError: document.getElementById('email-error'),
  password: document.getElementById('password'),
  passwordError: document.getElementById('password-error'),
  toggle: document.getElementById('toggle-password'),
  submit: document.getElementById('submit'),
  formMessage: document.getElementById('form-message'),
  formStatus: document.getElementById('form-status'),
};

/**
 * Makes the DOM match the state.
 *
 * Every property this function governs is set on every call, including back to
 * its empty or default value. That is deliberate and it is the whole reason the
 * approach works: a render that only sets things when they are "on" leaves the
 * previous render's leftovers behind, which is precisely how stale states
 * appear.
 *
 * Safe to call as often as you like.
 *
 * @param {typeof state} state
 */
function render(state) {
  // Only written when it actually differs. Assigning to `value` while someone
  // is typing can move the caret to the end, and this is the one place where
  // rendering could interfere with input.
  if (el.email.value !== state.values.email) {
    el.email.value = state.values.email;
  }
  if (el.password.value !== state.values.password) {
    el.password.value = state.values.password;
  }

  renderFieldError(el.email, el.emailError, state.errors.email);
  renderFieldError(el.password, el.passwordError, state.errors.password);

  // R7 amendment. Text only - never hidden or shown. See the note on
  // .form-message in styles.css for why a live region must stay in the page.
  el.formMessage.textContent = state.formMessage ?? '';

  // R3: the toggle's label and its announced state move together.
  el.password.type = state.passwordVisible ? 'text' : 'password';
  el.toggle.textContent = state.passwordVisible ? 'Hide' : 'Show';
  el.toggle.setAttribute('aria-pressed', String(state.passwordVisible));

  // R13. Read-only rather than disabled: a disabled input drops out of the tab
  // order mid-interaction, which moves focus somewhere the user did not ask for.
  el.email.readOnly = state.pending;
  el.password.readOnly = state.pending;
  el.submit.disabled = state.pending;
  el.submit.textContent = state.pending ? 'Signing in…' : 'Sign in';
  el.formStatus.textContent = state.pending ? 'Signing in' : '';
}

/**
 * One field's error, its message slot, and the wiring that ties them together
 * for assistive technology (R6, R11).
 *
 * @param {HTMLInputElement} input
 * @param {HTMLElement} slot
 * @param {string|null} message
 */
function renderFieldError(input, slot, message) {
  slot.textContent = message ?? '';

  if (message) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    // Removed rather than set to "false", so the attribute is absent when there
    // is nothing wrong. `aria-invalid="false"` is valid but noisier to read.
    input.removeAttribute('aria-invalid');
  }
}

/* ------------------------------------------------------------- events --- */

const validators = {
  email: validateEmail,
  password: validatePassword,
};

/**
 * R5: quiet until the first submit, then live — but only for a field that is
 * already showing an error.
 *
 * One rule covers both kinds of error. A format error (R6) is re-checked and
 * stays until the value is valid. A credential error (R7) can only exist on a
 * value that already passed format validation, so re-checking it returns null
 * and the stale "Incorrect email" clears on the first keystroke — which is
 * exactly what the R5 clarification requires, without the code having to know
 * which kind of error it is looking at.
 *
 * @param {'email' | 'password'} field
 * @param {HTMLInputElement} input
 */
function handleInput(field, input) {
  state.values[field] = input.value;

  // A field with no error stays quiet on input, even after a submit (R5).
  // Clearing a valid field back to empty does not nag; the next submit will.
  if (state.errors[field] !== null) {
    state.errors[field] = validators[field](state.values[field]);
  }

  render(state);
}

el.email.addEventListener('input', () => handleInput('email', el.email));
el.password.addEventListener('input', () => handleInput('password', el.password));

const GENERIC_FAILURE = 'Something went wrong. Please try again.';

/**
 * R7: each credential failure belongs to one field and has its own message.
 * Keyed by the reason codes signIn returns, so the form never needs to know how
 * a check was made - only what it concluded (ADR-0003).
 */
const CREDENTIAL_ERRORS = {
  unknown_email: { field: 'email', message: 'Incorrect email' },
  incorrect_password: { field: 'password', message: 'Incorrect password' },
};

/**
 * Turns a signIn result into state, and says where focus should go once the
 * form is unlocked.
 *
 * @param {Awaited<ReturnType<typeof signIn>>} result
 * @returns {HTMLElement|null}
 */
function applyResult(result) {
  if (result.ok) {
    // Rendered in T11, which replaces the form with the signed-in panel.
    state.session = { email: result.email };
    return null;
  }

  const known = CREDENTIAL_ERRORS[result.reason];

  if (known) {
    state.errors[known.field] = known.message;
    // R6: on a failed submit, focus moves to the field with the error. A
    // credential failure is a failed submit, so the same rule applies.
    return el[known.field];
  }

  // The default branch from the R7 amendment. Unreachable in this version,
  // since signIn only returns the two reasons above. It is here because a real
  // server will return reasons this list has never heard of, and the worst
  // possible response to one is saying nothing.
  state.formMessage = GENERIC_FAILURE;
  return el.submit;
}

el.toggle.addEventListener('click', () => {
  state.passwordVisible = !state.passwordVisible;
  render(state);
});

el.form.addEventListener('submit', async (event) => {
  // Unconditionally, before anything else. Without it the browser performs its
  // default GET and puts the password in the address bar, where it lands in
  // history and in server logs.
  event.preventDefault();

  // R13: a second submit cannot start while one is in flight. The disabled
  // button already blocks both clicks and Enter, but that is a property of the
  // markup; this is the rule itself, stated where it cannot be styled away.
  if (state.pending) return;

  // A previous attempt's generic failure was about that attempt, not this one.
  state.formMessage = null;

  // R6: format first, always. Credentials are only ever checked on values that
  // are well-formed, so the two error systems cannot contend for one slot.
  state.errors = validateForm(state.values);
  render(state);

  // R6 / R11: send focus to the first problem, in document order. Focusing the
  // input also makes a screen reader announce its label and, through
  // aria-describedby, its error — so the message is heard without a separate
  // live region for field errors.
  const firstInvalid = state.errors.email
    ? el.email
    : state.errors.password
      ? el.password
      : null;

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  // R13: from here until the result is in, the form is locked.
  state.pending = true;
  render(state);

  let focusAfter = null;

  try {
    const result = await signIn(state.values.email, state.values.password);
    focusAfter = applyResult(result);
  } catch {
    // Nothing in this version can throw. A real network can, and the R7
    // amendment's rule applies to it just the same: never end in silence.
    state.formMessage = GENERIC_FAILURE;
    focusAfter = el.submit;
  } finally {
    // R13: restored on every path, including ones nobody anticipated. This is
    // the line that makes "stuck disabled forever" structurally impossible
    // rather than merely untested.
    state.pending = false;
    render(state);
  }

  // After the render that unlocked the form, not before: a button cannot take
  // focus while it is still disabled.
  focusAfter?.focus();
});

// One render before anything happens, so the page starts in a state this file
// chose rather than whatever the markup happened to contain.
render(state);
