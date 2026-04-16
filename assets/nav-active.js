(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const links = nav.querySelectorAll('.nav-links a[data-nav]');
  if (!links.length) return;

  const SECTION_IDS = ['about', 'work', 'skills', 'contact'];
  /** Scroll position (px) past which a section “counts”; ~upper quarter of viewport */
  const VIEWPORT_FRAC = 0.25;

  const firstHref = links[0].getAttribute('href') || '';
  const isHome = firstHref.startsWith('#');

  function clearActive() {
    links.forEach(function (a) {
      a.classList.remove('is-active');
      a.removeAttribute('aria-current');
    });
  }

  function setActive(id) {
    clearActive();
    const a = nav.querySelector('.nav-links a[data-nav="' + id + '"]');
    if (a) {
      a.classList.add('is-active');
      a.setAttribute('aria-current', 'location');
    }
  }

  if (!isHome) {
    setActive('work');
    return;
  }

  function markerY() {
    return window.scrollY + window.innerHeight * VIEWPORT_FRAC;
  }

  function syncFromScroll() {
    const scrollH = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    );
    const atEnd =
      window.scrollY + window.innerHeight >= scrollH - 6;
    if (atEnd) {
      setActive(SECTION_IDS[SECTION_IDS.length - 1]);
      return;
    }

    const y = markerY();
    let current = null;
    for (let i = 0; i < SECTION_IDS.length; i++) {
      const id = SECTION_IDS[i];
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (top <= y) current = id;
    }
    if (current) setActive(current);
    else clearActive();
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      syncFromScroll();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncFromScroll, { passive: true });
  window.addEventListener('hashchange', function () {
    syncFromScroll();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      syncFromScroll();
      requestAnimationFrame(syncFromScroll);
    });
  } else {
    syncFromScroll();
    requestAnimationFrame(syncFromScroll);
  }
})();
