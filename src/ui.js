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

/**
 * Everything the page can be. One object, so there is one place to look.
 */
const state = {
  values: { email: '', password: '' },
  errors: { email: null, password: null }, // message string, or null
  submitted: false, // has submit been attempted at least once (R5)
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

el.email.addEventListener('input', () => {
  state.values.email = el.email.value;
  render(state);
});

el.password.addEventListener('input', () => {
  state.values.password = el.password.value;
  render(state);
});

el.toggle.addEventListener('click', () => {
  state.passwordVisible = !state.passwordVisible;
  render(state);
});

el.form.addEventListener('submit', (event) => {
  // Unconditionally, before anything else. Without it the browser performs its
  // default GET and puts the password in the address bar, where it lands in
  // history and in server logs.
  //
  // T9 fills in what should happen instead. It is here now because the
  // alternative is a commit in which signing in leaks the password to the URL,
  // and an intermediate state is still a state someone could check out.
  event.preventDefault();
});

// One render before anything happens, so the page starts in a state this file
// chose rather than whatever the markup happened to contain.
render(state);
