/* ============================================================
   infeos® — Landing interactions
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Nav scroll state ---- */
  const nav = document.getElementById('nav');
  const sticky = document.querySelector('.sticky-cta');
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 24);
    if (sticky) sticky.classList.toggle('show', y > 700);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Mobile menu ---- */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('mobileMenu');
  const closeMenu = () => {
    document.body.classList.remove('menu-open', 'no-scroll');
    if (burger) burger.setAttribute('aria-expanded', 'false');
  };
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      document.body.classList.toggle('no-scroll', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---- Reveal on scroll ---- */
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---- Animated counters ---- */
  const fmt = new Intl.NumberFormat('de-DE');
  function animateCounter(el, to, { suffix = '', plain = false } = {}) {
    if (reduceMotion) { el.textContent = (plain ? String(to) : fmt.format(to)) + suffix; return; }
    const dur = 1500;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(to * eased);
      el.textContent = (plain ? String(v) : fmt.format(v)) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function setupCounter(el) {
    const to = parseInt(el.dataset.to, 10);
    const opts = { suffix: el.dataset.suffix || '', plain: el.dataset.plain === '1' };
    if (reduceMotion || !('IntersectionObserver' in window)) { animateCounter(el, to, opts); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animateCounter(el, to, opts); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    io.observe(el);
  }

  document.querySelectorAll('[data-counter]').forEach(setupCounter);
  // Hero + bridge teaser counters (currency)
  ['heroCounter'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) setupCounter(el);
  });

  /* ---- Contact form (Web3Forms · kein Backend) ---- */
  (function contactForm() {
    const btn = document.getElementById('contactBtn');
    if (!btn) return;
    const KEY = window.WEB3FORMS_KEY || 'REPLACE-WITH-INFEOS-WEB3FORMS-KEY';
    const g = (id) => document.getElementById(id);
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const setErr = (id, bad) => {
      const f = g(id), e = g('ce_' + id.slice(2));
      if (f) f.classList.toggle('error', bad);
      if (e) e.classList.toggle('show', bad);
    };
    ['c_name', 'c_email', 'c_message'].forEach((id) => {
      const el = g(id); if (el) el.addEventListener('input', () => setErr(id, false));
    });
    g('c_consent').addEventListener('change', () => g('ce_consent').classList.remove('show'));

    btn.addEventListener('click', async () => {
      const name = g('c_name').value.trim();
      const email = g('c_email').value.trim();
      const msg = g('c_message').value.trim();
      let ok = true;
      if (!name) { setErr('c_name', true); ok = false; }
      if (!emailRe.test(email)) { setErr('c_email', true); ok = false; }
      if (!msg) { setErr('c_message', true); ok = false; }
      if (!g('c_consent').checked) { g('ce_consent').classList.add('show'); ok = false; }
      if (!ok) { const fe = document.querySelector('#contactFormView .error'); if (fe) fe.focus(); return; }

      btn.disabled = true; btn.style.opacity = '.7';
      const orig = btn.innerHTML; btn.textContent = 'Senden …';
      const firma = g('c_firma').value.trim();
      const telefon = g('c_telefon').value.trim();
      const thema = g('c_thema').value;

      let status = 'no-key';
      if (KEY && KEY.indexOf('REPLACE') !== 0) {
        const fd = new FormData();
        fd.append('access_key', KEY);
        fd.append('subject', `[Kontakt] ${name}${firma ? ' · ' + firma : ''}${thema ? ' — ' + thema : ''}`);
        fd.append('from_name', 'infeos · Kontaktformular');
        fd.append('name', name);
        fd.append('email', email);
        fd.append('telefon', telefon);
        fd.append('firma', firma);
        fd.append('thema', thema);
        fd.append('message', `Name: ${name}\nFirma: ${firma || '—'}\nE-Mail: ${email}\nTelefon: ${telefon || '—'}\nThema: ${thema || '—'}\n\n${msg}`);
        try {
          const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
          const j = await res.json().catch(() => ({}));
          status = (res.ok && j.success !== false) ? 'ok' : 'fail';
        } catch (e) { status = 'fail'; }
      }

      g('contactFormView').style.display = 'none';
      g('contactSuccess').classList.add('show');
      const note = g('contactSuccessNote');
      if (status === 'no-key') note.textContent = '(Demo: Web3Forms-Key noch nicht hinterlegt — Anfrage wurde noch nicht verschickt.)';
      else if (status === 'fail') note.textContent = '(Versand aktuell nicht erreichbar — bitte per E-Mail oder Telefon melden.)';
      else note.textContent = '';
      btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = orig;
      g('contactSuccess').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  })();

  /* ---- Active nav link on scroll-spy ---- */
  const sections = ['problem', 'usecases', 'rechner', 'leistungen', 'ueber', 'kontakt']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinks = document.querySelectorAll('.nav__links a');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }
})();
