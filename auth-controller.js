import { supabase, isSupabaseEnabled } from './supabaseClient.js';
import { setCurrentUserId } from './storage.js';

// ---------------------------------------------------------------------------
// DOM shorthand
// ---------------------------------------------------------------------------
const el = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// View switching (auth overlay sub-views)
// ---------------------------------------------------------------------------
function showView(viewId) {
  ['authLogin', 'authSignup', 'authReset'].forEach(id => {
    const v = el(id);
    if (v) v.classList.toggle('active', id === viewId);
  });
  clearMessages();
}

function clearMessages() {
  ['loginError','signupError','signupSuccess','resetError','resetSuccess'].forEach(id => {
    const n = el(id);
    if (n) { n.textContent = ''; n.innerHTML = ''; }
  });
}

function setError(id, msg)   { const n = el(id); if (n) n.textContent = msg; }
function setSuccess(id, msg) { const n = el(id); if (n) n.innerHTML  = msg; }

function setLoading(btnId, loading) {
  const btn = el(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Aguarde...' : (btn.dataset.label ?? btn.textContent);
}

function resetAllButtons() {
  ['loginBtn', 'signupBtn', 'resetBtn'].forEach(id => setLoading(id, false));
}

// ---------------------------------------------------------------------------
// Overlay visibility
// ---------------------------------------------------------------------------
export function showAuthOverlay() {
  const o = el('authOverlay');
  if (o) o.style.display = 'flex';
  resetAllButtons();
  showView('authLogin');
}

export function hideAuthOverlay() {
  const o = el('authOverlay');
  if (o) o.style.display = 'none';
}

// ---------------------------------------------------------------------------
// Password toggle
// ---------------------------------------------------------------------------
function wirePasswordToggle(btnId, inputId) {
  const btn = el(btnId), input = el(inputId);
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    btn.textContent = hidden ? '🙈' : '👁';
  });
}

// ---------------------------------------------------------------------------
// Role helpers
// ---------------------------------------------------------------------------
function gerarCodigoAtivacao() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

function getRoleSelected() {
  return document.querySelector('input[name="signupRole"]:checked')?.value ?? 'profissional';
}

// Whether a profile role counts as the professional/trainer side
export function isProfissional(role) {
  return role === 'profissional' || role === 'personal';
}

function toggleActivationCodeField() {
  const field = el('activationCodeField');
  const input = el('signupActivationCode');
  if (!field) return;
  const isCliente = getRoleSelected() === 'cliente';
  field.style.display = isCliente ? 'block' : 'none';
  if (input) input.required = isCliente;

  const cardProf   = el('roleCardProfissional');
  const cardClient = el('roleCardCliente');
  if (cardProf) {
    cardProf.style.border     = isCliente ? '2px solid #e2e8f0' : '2px solid #3b82f6';
    cardProf.style.background = isCliente ? '#f8fafc' : '#eff6ff';
    cardProf.style.color      = isCliente ? '#475569' : '#1e3a8a';
  }
  if (cardClient) {
    cardClient.style.border     = isCliente ? '2px solid #3b82f6' : '2px solid #e2e8f0';
    cardClient.style.background = isCliente ? '#eff6ff' : '#f8fafc';
    cardClient.style.color      = isCliente ? '#1e3a8a' : '#475569';
  }
}

// ---------------------------------------------------------------------------
// Profile & client fetches
// ---------------------------------------------------------------------------
export async function fetchUserProfile(userId) {
  if (!isSupabaseEnabled) {
    return { role: 'profissional', activation_code: null, professional_id: null };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, activation_code, professional_id, email, full_name')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.error('[Auth] fetchUserProfile error:', error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error('[Auth] fetchUserProfile exception:', e);
    return null;
  }
}

export async function fetchClientes(profissionalId) {
  if (!isSupabaseEnabled) return [];
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, first_name, last_name')
    .eq('professional_id', profissionalId);
  if (error) { console.error('[Auth] fetchClientes error:', error.message); return []; }
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Internal: called from onAuthStateChange when a valid session exists.
// Single source of truth — avoids double-calling onLoginSuccess.
// ---------------------------------------------------------------------------
async function doLoginSuccess(session, onLoginSuccess) {
  resetAllButtons();
  try {
    const profile = await fetchUserProfile(session.user.id);
    setCurrentUserId(session.user.id);
    hideAuthOverlay();
    await onLoginSuccess(profile ?? { role: 'profissional', activation_code: null, professional_id: null });
  } catch (e) {
    console.error('[Auth] doLoginSuccess error:', e);
    setError('loginError', 'Erro ao carregar perfil. Tente novamente.');
    showAuthOverlay();
  }
}

// ---------------------------------------------------------------------------
// LOGIN — only handles success/error. Routing is done by onAuthStateChange.
// ---------------------------------------------------------------------------
async function handleLogin() {
  const email    = el('loginEmail')?.value.trim() ?? '';
  const password = el('loginPassword')?.value ?? '';

  if (!email || !password) {
    setError('loginError', 'Preencha email e senha.');
    return;
  }

  setLoading('loginBtn', true);
  clearMessages();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Error: reset button immediately and show message
    setLoading('loginBtn', false);
    setError('loginError', traduzir(error.message));
    // Special hint for unconfirmed email
    if (error.message.includes('Email not confirmed')) {
      setError('loginError',
        'Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.');
    }
  }
  // On success: button stays in "Aguarde..." until onAuthStateChange fires SIGNED_IN,
  // which calls doLoginSuccess → resetAllButtons.
}

// ---------------------------------------------------------------------------
// SIGN UP — dual-role with pre-checks
// ---------------------------------------------------------------------------
async function handleSignup() {
  const firstName = (el('signupFirstName')?.value ?? '').trim();
  const lastName  = (el('signupLastName')?.value  ?? '').trim();
  const email     = (el('signupEmail')?.value     ?? '').trim();
  const password  = (el('signupPassword')?.value  ?? '');
  const role      = getRoleSelected();

  clearMessages();

  // Basic validation
  if (!firstName || !lastName)  { setError('signupError', 'Preencha nome e sobrenome.'); return; }
  if (!email || !password)      { setError('signupError', 'Preencha email e senha.'); return; }
  if (password.length < 6)      { setError('signupError', 'A senha deve ter pelo menos 6 caracteres.'); return; }

  setLoading('signupBtn', true);

  try {
    // ── Bug 3 fix: pre-check email existence ────────────────────────────────
    const { data: emailExists, error: checkErr } = await supabase.rpc(
      'check_email_registered', { p_email: email }
    );
    if (checkErr) {
      console.warn('[Auth] email pre-check failed (non-fatal):', checkErr.message);
      // Non-fatal: proceed with signup; Supabase will handle it
    } else if (emailExists) {
      setError('signupError',
        'Este email já está cadastrado. Faça login ou use "Esqueci a senha".');
      setLoading('signupBtn', false);
      return;
    }

    let metadata = { role, first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}` };

    if (role === 'profissional') {
      metadata.activation_code = gerarCodigoAtivacao();
    } else {
      // ── Bug 2 fix: validate activation code with full error handling ────────
      const inputCode = (el('signupActivationCode')?.value ?? '').trim().toUpperCase();
      if (!inputCode) {
        setError('signupError', 'Informe o código de ativação do seu profissional.');
        setLoading('signupBtn', false);
        return;
      }

      const { data: profId, error: lookupErr } = await supabase.rpc(
        'lookup_professional_by_code', { p_code: inputCode }
      );

      if (lookupErr) {
        console.error('[Auth] lookup_professional_by_code error:', lookupErr.message);
        setError('signupError', 'Erro ao validar código. Verifique sua conexão e tente novamente.');
        setLoading('signupBtn', false);
        return;
      }
      if (!profId) {
        setError('signupError', 'Código inválido. Verifique o código com seu profissional.');
        setLoading('signupBtn', false);
        return;
      }

      metadata.professional_id = profId;
    }

    // ── Actual sign-up ───────────────────────────────────────────────────────
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );

    let signUpData, signUpErr;
    try {
      ({ data: signUpData, error: signUpErr } = await Promise.race([
        supabase.auth.signUp({
          email,
          password,
          options: { data: metadata, emailRedirectTo: window.location.origin }
        }),
        timeout
      ]));
    } catch (raceErr) {
      setError('signupError', raceErr.message === 'timeout'
        ? 'Tempo esgotado. Verifique sua conexão e tente novamente.'
        : traduzir(raceErr.message));
      setLoading('signupBtn', false);
      return;
    }

    if (signUpErr) {
      setError('signupError', traduzir(signUpErr.message));
      setLoading('signupBtn', false);
      return;
    }

    // session is null when email confirmation is required
    const needsConfirmation = !signUpData?.session;

    if (needsConfirmation) {
      const codeMsg = role === 'profissional'
        ? ` <br><br>Guarde seu código de ativação: <strong style="letter-spacing:.12em;">${metadata.activation_code}</strong>`
        : '';
      // Clear form fields
      ['signupFirstName', 'signupLastName', 'signupEmail', 'signupPassword', 'signupActivationCode'].forEach(id => {
        const inp = el(id); if (inp) inp.value = '';
      });
      setSuccess('signupSuccess',
        `Conta criada! Verifique seu email e clique no link de confirmação antes de fazer login.${codeMsg}`
      );
      setLoading('signupBtn', false);
    }
    // If session exists (email confirmation disabled), onAuthStateChange fires SIGNED_IN automatically.

  } catch (e) {
    console.error('[Auth] handleSignup exception:', e);
    setError('signupError', 'Erro inesperado. Tente novamente.');
    setLoading('signupBtn', false);
  }
}

// ---------------------------------------------------------------------------
// RESET PASSWORD
// ---------------------------------------------------------------------------
async function handleReset() {
  const email = (el('resetEmail')?.value ?? '').trim();
  if (!email) { setError('resetError', 'Informe seu email.'); return; }

  setLoading('resetBtn', true);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin
  });
  setLoading('resetBtn', false);

  if (error) setError('resetError', traduzir(error.message));
  else       setSuccess('resetSuccess', 'Link enviado! Verifique sua caixa de entrada.');
}

// ---------------------------------------------------------------------------
// SIGN OUT
// ---------------------------------------------------------------------------
export async function signOut() {
  if (!isSupabaseEnabled) return;
  setCurrentUserId(null);
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// Portuguese error map
// ---------------------------------------------------------------------------
function traduzir(msg) {
  if (!msg) return 'Erro desconhecido.';
  if (msg.includes('Invalid login credentials'))  return 'Email ou senha inválidos.';
  if (msg.includes('Email not confirmed'))         return 'Email não confirmado. Verifique sua caixa de entrada.';
  if (msg.includes('User already registered'))    return 'Este email já está cadastrado.';
  if (msg.includes('Password should be'))         return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('rate limit'))                 return 'Muitas tentativas. Aguarde alguns minutos.';
  if (msg.includes('network') || msg.includes('fetch')) return 'Sem conexão. Verifique sua internet.';
  if (msg.includes('Database error'))             return 'Erro no banco de dados. Tente novamente.';
  return msg;
}

// ---------------------------------------------------------------------------
// initAuth — single entry point, called once from renderer.js
// ---------------------------------------------------------------------------
export function initAuth({ onLoginSuccess, onLogout }) {
  if (!isSupabaseEnabled) {
    hideAuthOverlay();
    onLoginSuccess({ role: 'profissional', activation_code: null, professional_id: null });
    return;
  }

  // ── Bug 1 + 5 fix: single source of truth for auth routing ──────────────
  // onAuthStateChange fires:
  //   INITIAL_SESSION — on startup (has session = restored, or null = not logged in)
  //   SIGNED_IN       — after manual login or OAuth
  //   SIGNED_OUT      — after signOut()
  //   TOKEN_REFRESHED — token rotated (no action needed)
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] event:', event, session ? '(session)' : '(no session)');

    if (event === 'INITIAL_SESSION') {
      if (session) {
        await doLoginSuccess(session, onLoginSuccess);
      } else {
        showAuthOverlay();
      }
      return;
    }

    if (event === 'SIGNED_IN' && session) {
      await doLoginSuccess(session, onLoginSuccess);
      return;
    }

    if (event === 'SIGNED_OUT') {
      setCurrentUserId(null);
      if (typeof onLogout === 'function') onLogout();
      showAuthOverlay();
    }
  });

  // ── Wire view navigation ─────────────────────────────────────────────────
  el('goToSignup')          ?.addEventListener('click', () => showView('authSignup'));
  el('goToReset')           ?.addEventListener('click', () => showView('authReset'));
  el('goToLoginFromSignup') ?.addEventListener('click', () => showView('authLogin'));
  el('goToLoginFromReset')  ?.addEventListener('click', () => showView('authLogin'));

  // ── Role selector → show/hide activation code field ─────────────────────
  document.querySelectorAll('input[name="signupRole"]').forEach(radio => {
    radio.addEventListener('change', toggleActivationCodeField);
  });
  // Also wire card labels directly so clicks register the change
  el('roleCardProfissional')?.addEventListener('click', toggleActivationCodeField);
  el('roleCardCliente')?.addEventListener('click', toggleActivationCodeField);
  toggleActivationCodeField(); // set initial state

  // ── Password toggles ─────────────────────────────────────────────────────
  wirePasswordToggle('toggleLoginPassword',  'loginPassword');
  wirePasswordToggle('toggleSignupPassword', 'signupPassword');

  // ── Form actions ─────────────────────────────────────────────────────────
  el('loginBtn') ?.addEventListener('click', () => handleLogin());
  el('signupBtn')?.addEventListener('click', () => handleSignup());
  el('resetBtn') ?.addEventListener('click', () => handleReset());

  // ── Enter key shortcuts ──────────────────────────────────────────────────
  el('loginEmail')    ?.addEventListener('keydown', e => { if (e.key === 'Enter') el('loginPassword')?.focus(); });
  el('loginPassword') ?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  el('signupPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSignup(); });
  el('signupActivationCode')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSignup(); });
  el('resetEmail')    ?.addEventListener('keydown', e => { if (e.key === 'Enter') handleReset(); });

  // ── Logout ───────────────────────────────────────────────────────────────
  el('navLogout')?.addEventListener('click', () => signOut());
}
