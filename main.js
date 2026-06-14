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

  /* ---- Active nav link on scroll-spy ---- */
  const sections = ['problem', 'usecases', 'rechner', 'leistungen', 'vorgehen', 'ueber']
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
