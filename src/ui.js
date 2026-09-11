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
 *
 * There is no copy of the field values either. The browser owns what is in an
 * input - typing, autofill, password managers and form restoration all write
 * there, and not all of them fire an event - so a copy kept here goes stale,
 * and a render that wrote it back erased real input. Code reads the fields
 * directly when it needs them (F5, ADR-0004 amendment).
 *
 * Built by a function rather than written once as a literal, because R8 needs
 * exactly this state again on sign out. With one function serving both, "first
 * visit" and "after sign out" cannot drift apart - there is only one definition
 * of what a fresh form is.
 */
function initialState() {
  return {
    errors: { email: null, password: null }, // message string, or null
    formMessage: null, // a failure that belongs to neither field (R7)
    pending: false, // a sign-in is in flight (R13)
    passwordVisible: false, // (R3)
    session: null, // { email } once signed in (R8)
  };
}

const state = initialState();

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
  title: document.getElementById('card-title'),
  subtitle: document.getElementById('card-subtitle'),
  session: document.getElementById('session'),
  sessionEmail: document.getElementById('session-email'),
  signOut: document.getElementById('sign-out'),
  forgot: document.getElementById('forgot-password'),
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
  // Input values are deliberately absent: render never writes into a field.
  // See the note on state above (F5).
  renderFieldError(el.email, el.emailError, state.errors.email);
  renderFieldError(el.password, el.passwordError, state.errors.password);

  // R7 amendment. Text only - never hidden or shown. See the note on
  // .form-message in styles.css for why a live region must stay in the page.
  setText(el.formMessage, state.formMessage ?? '');

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
  setText(el.formStatus, state.pending ? 'Signing in' : '');

  // R8: the signed-in panel replaces the form, in place, inside the same card.
  const signedIn = state.session !== null;
  el.form.hidden = signedIn;
  el.session.hidden = !signedIn;
  el.sessionEmail.textContent = state.session?.email ?? '';
  el.title.textContent = signedIn ? 'You’re signed in' : 'Sign in';
  el.subtitle.hidden = signedIn;
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
  setText(slot, message ?? '');

  if (message) {
    input.setAttribute('aria-invalid', 'true');
  } else {
    // Removed rather than set to "false", so the attribute is absent when there
    // is nothing wrong. `aria-invalid="false"` is valid but noisier to read.
    input.removeAttribute('aria-invalid');
  }
}

/**
 * Writes text only when it differs from what is already there.
 *
 * Every write to a live region is a potential announcement, and render runs on
 * every keystroke. Rewriting an unchanged "Password is required" on each key
 * pressed in the email field could have it read out again and again. Writing
 * only on a real change keeps "render sets everything" true without making the
 * page talk over the person typing (F4).
 *
 * @param {HTMLElement} node
 * @param {string} text
 */
function setText(node, text) {
  if (node.textContent !== text) node.textContent = text;
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
  // A field with no error stays quiet on input, even after a submit (R5).
  // Clearing a valid field back to empty does not nag; the next submit will.
  if (state.errors[field] !== null) {
    state.errors[field] = validators[field](input.value);
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
    state.session = { email: result.email };
    // R8 / R11: the button that had focus has just been hidden along with the
    // form, so focus must go somewhere deliberate. The heading announces the
    // new state; leaving focus to chance would announce nothing at all.
    return el.title;
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

el.forgot.addEventListener('click', (event) => {
  // R4: a placeholder that navigates nowhere. The href has to stay, because an
  // <a> without one cannot be reached with Tab. This cancels the jump to "#"
  // that the href would otherwise make, which changed the URL and added a
  // history entry. Found at T12.
  event.preventDefault();
});

el.toggle.addEventListener('click', () => {
  state.passwordVisible = !state.passwordVisible;
  render(state);
});

el.signOut.addEventListener('click', () => {
  // R8: back to a genuine first visit. Deliberately not a list of fields to
  // clear, which would be one short the day someone adds a field - the same
  // function that built the first state builds this one.
  Object.assign(state, initialState());

  // The one place the page writes field values, and it only ever clears them.
  // reset() empties every field in the form, including any added later, so it
  // keeps the property above: there is no list of fields to fall out of date.
  // It is the single exception to "handlers never touch the DOM" - the values
  // are the browser's, not state's (F5, ADR-0004 amendment).
  el.form.reset();
  render(state);

  // R8: the user will type their email next, so that is where focus goes.
  el.email.focus();
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

  // Read straight from the fields: the page keeps no copy of them (F5).
  const values = { email: el.email.value, password: el.password.value };

  // R6: format first, always. Credentials are only ever checked on values that
  // are well-formed, so the two error systems cannot contend for one slot.
  state.errors = validateForm(values);
  render(state);

  // R6 / R11: send focus to the first problem, in document order. Focus alone
  // does not get the error announced: if that field already has focus - Enter
  // pressed inside it - focusing it again does nothing. The error slots are
  // live regions so that an error is announced when it appears (F4). An
  // identical error on a repeated submit is not announced again, because its
  // text has not changed; that is recorded as a known limitation.
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
    const result = await signIn(values.email, values.password);
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

// One render before anything happens, so everything render governs starts in a
// state this file chose. The fields' contents are not among those things: a
// browser may restore or autofill them, and that is the browser's business (F5).
render(state);
