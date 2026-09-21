(function () {
  const STORAGE_KEY = 'vibe3.supabase.session';

  function config() {
    return window.__SUPABASE_CONFIG__ || {};
  }

  function readSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('vibe3:auth-change'));
  }

  async function authRequest(path, options = {}) {
    const { url, anonKey } = config();
    if (!url || !anonKey) throw new Error('인증 연결 설정이 필요해요.');

    const response = await fetch(`${url}/auth/v1${path}`, {
      ...options,
      headers: {
        apikey: anonKey,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.msg || data.message || data.error_description || '요청을 처리하지 못했어요.';
      throw new Error(message);
    }
    return data;
  }

  async function refreshSession(session) {
    if (!session?.refresh_token) return null;
    try {
      const refreshed = await authRequest('/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });
      saveSession(refreshed);
      return refreshed;
    } catch {
      saveSession(null);
      return null;
    }
  }

  async function getSession() {
    const session = readSession();
    if (!session?.access_token) return null;
    const expiresAt = Number(session.expires_at || 0) * 1000;
    if (expiresAt && expiresAt < Date.now() + 30_000) return refreshSession(session);
    return session;
  }

  async function signUp(email, password) {
    const redirectTo = encodeURIComponent(`${location.origin}/login?confirmed=1`);
    const data = await authRequest(`/signup?redirect_to=${redirectTo}`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) saveSession(data);
    return data;
  }

  async function signIn(email, password) {
    const data = await authRequest('/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data);
    return data;
  }

  async function signOut() {
    const session = readSession();
    try {
      if (session?.access_token) {
        await authRequest('/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      }
    } finally {
      saveSession(null);
      location.href = '/';
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    })[character]);
  }

  async function renderAuthNav() {
    const targets = document.querySelectorAll('[data-auth-nav]');
    if (!targets.length) return;
    const session = await getSession();
    targets.forEach((target) => {
      if (session?.user?.email) {
        target.innerHTML = `<span class="auth-email" title="${escapeHtml(session.user.email)}">${escapeHtml(session.user.email)}</span><button class="auth-link auth-logout" type="button">로그아웃</button>`;
        target.querySelector('.auth-logout').addEventListener('click', signOut);
      } else {
        target.innerHTML = '<a class="auth-link" href="/login">로그인</a><a class="auth-button" href="/signup">회원가입</a>';
      }
    });
  }

  function safeNext(value) {
    return value && value.startsWith('/') && !value.startsWith('//') ? value : '/list';
  }

  window.VibeAuth = { getSession, signUp, signIn, signOut, saveSession, safeNext };
  window.addEventListener('vibe3:auth-change', renderAuthNav);
  document.addEventListener('DOMContentLoaded', renderAuthNav);
})();
