/* ============================================================
   FROJECT LANDING — auth flow + interactions
   ============================================================ */
(function () {
  'use strict';

  // ---------- Theme (sync with app) ----------
  const savedTheme = localStorage.getItem('froject_theme') || 'dark';
  document.documentElement.dataset.theme = savedTheme;

  // ---------- If already authed, offer to go straight to dashboard ----------
  // (We don't auto-redirect — the landing is a marketing page users may want to see.)

  // ---------- Helpers ----------
  function readJson(key, fallback) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
    catch { return fallback; }
  }
  function mailAddr(login) {
    return (String(login || 'user').toLowerCase().split('@')[0].replace(/[^a-z0-9._-]/g, '') || 'user') + '@fmail.ru';
  }

  // ---------- Auth modal ----------
  const modal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabs = document.querySelectorAll('.atb');

  function openAuth(tab) {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    switchTab(tab || 'login');
  }
  function closeAuth() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }
  function switchTab(tab) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    loginForm.hidden = tab !== 'login';
    registerForm.hidden = tab !== 'register';
  }

  // open triggers
  document.querySelectorAll('[data-auth]').forEach(btn => {
    btn.addEventListener('click', () => openAuth(btn.dataset.auth));
  });
  document.getElementById('auth-close')?.addEventListener('click', closeAuth);
  document.querySelector('[data-close-auth]')?.addEventListener('click', closeAuth);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeAuth(); });
  tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // live mail preview on register
  const regEmail = document.getElementById('reg-email');
  const regMailPreview = document.getElementById('reg-mail-preview');
  regEmail?.addEventListener('input', () => {
    regMailPreview.textContent = mailAddr(regEmail.value);
  });

  // ---------- Auth submit → save session → go to welcome → dashboard ----------
  function finishAuth(session) {
    // Persist session + user record
    const users = readJson('froject_users', {});
    users[session.login] = { pass: session.pass || 'x', name: session.name, role: session.role, team: session.team };
    localStorage.setItem('froject_users', JSON.stringify(users));

    const sessionData = {
      login: session.login,
      name: session.name,
      role: session.role || 'user',
      team: session.team || 'Моя команда',
      mail: mailAddr(session.login),
      createdAt: Date.now(),
      remember: !!session.remember,
    };
    localStorage.setItem('froject_session', JSON.stringify(sessionData));

    // Redirect to dashboard with welcome flag
    window.location.href = 'index.html?welcome=1';
  }

  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    const remember = document.getElementById('login-remember').checked;
    if (!email || !pass) return;

    // Look up existing user to recover their name/role/team if any
    const users = readJson('froject_users', {});
    const login = email.split('@')[0];
    const existing = users[login] || users[email];
    finishAuth({
      login: login,
      pass: pass,
      name: existing?.name || login.charAt(0).toUpperCase() + login.slice(1),
      role: existing?.role || 'user',
      team: existing?.team || 'Моя команда',
      remember,
    });
  });

  registerForm?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    const team = document.getElementById('reg-team').value.trim();
    const role = document.getElementById('reg-role').value;
    const terms = document.getElementById('reg-terms').checked;
    if (!name || !email || !pass || !team || !terms) return;
    finishAuth({
      login: email.split('@')[0],
      pass,
      name,
      role,
      team,
    });
  });

  // ---------- Billing toggle ----------
  const billBtns = document.querySelectorAll('.bt');
  const priceVals = document.querySelectorAll('.price-val');
  billBtns.forEach(b => b.addEventListener('click', () => {
    billBtns.forEach(x => x.classList.toggle('active', x === b));
    const mode = b.dataset.bill;
    priceVals.forEach(pv => {
      const m = +pv.dataset.month;
      const y = +pv.dataset.year;
      if (m === 0) { pv.textContent = '0'; return; }
      if (mode === 'year') {
        // monthly equivalent of yearly price
        pv.textContent = Math.round(y / 12).toLocaleString('ru-RU');
      } else {
        pv.textContent = m.toLocaleString('ru-RU');
      }
    });
  }));

  // ---------- Nav burger (mobile) ----------
  const burger = document.getElementById('nav-burger');
  const navLinks = document.querySelector('.nav-links');
  burger?.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    if (open) {
      navLinks.style.display = '';
    } else {
      navLinks.style.display = 'flex';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '60px';
      navLinks.style.left = '0';
      navLinks.style.right = '0';
      navLinks.style.flexDirection = 'column';
      navLinks.style.background = 'var(--bg-elev)';
      navLinks.style.padding = '16px 20px';
      navLinks.style.borderBottom = '1px solid var(--border)';
      navLinks.style.gap = '12px';
    }
  });
  navLinks?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 760) navLinks.style.display = '';
  }));

  // ---------- Smooth scroll for nav anchors ----------
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#' || id === '#top') {
        if (id === '#top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        return;
      }
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- Reveal on scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.style.opacity = '1';
        en.target.style.transform = 'translateY(0)';
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.feature, .module, .ai-card, .plan, .about-visual, .cta-inner').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .55s cubic-bezier(.2,.8,.2,1), transform .55s cubic-bezier(.2,.8,.2,1)';
    io.observe(el);
  });
})();
