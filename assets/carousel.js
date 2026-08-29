/* ═══════════════════════════════════════════════
   LYON HUANG — SHARED CASE-STUDY CAROUSEL + LIGHTBOX
   One data-driven engine for every case study. Markup + CSS are shared
   (.ch1-carousel* / .ch1-lightbox* in assets/case-study-shared.css); each
   page provides only slide data via window.CS_CAROUSELS. This replaces the
   per-carousel IIFEs and hand-written lightbox nodes that used to be copied
   into each work page.

   Page config (set inline before this deferred script runs):
     window.CS_CAROUSELS = {
       base: 'https://…/',                    // optional; prefixed to relative src
       carousels: {                            // id → slides (subtitle read from DOM,
         'pl-c-ctv': { slides: [{src,alt}, …], subtitle: '…' }   // or overridden here)
       },
       tabbed: [                               // optional: cards that swap the slide set
         { carousel:'ch1-carousel', caption:'ch1-concept-caption', placeholder:'…',
           tabs:[ { card:'ch1-concept-card-1', subtitle:'Concept 1', caption:'…',
                    slides:[{src,alt}, …] }, … ] }
       ]
     };
   Single images (zoom only, no carousel) are auto-discovered from any
   .ch1-concept-media[data-subtitle] — no config needed.
   ═══════════════════════════════════════════════ */
(function(){
  var CFG  = window.CS_CAROUSELS || {};
  var BASE = CFG.base || '';
  function url(src){ return /^(https?:)?\/\//.test(src) ? src : BASE + src; }

  /* ── One shared lightbox, injected once ── */
  var LB = {};
  var st = { slides: [], idx: 0, onChange: null, focus: null, dotEls: null };

  function makeDots(container, count){
    container.innerHTML = '';
    for (var i = 0; i < count; i++){
      var s = document.createElement('span');
      s.className = 'ch1-dot' + (i === 0 ? ' is-active' : '');
      container.appendChild(s);
    }
    return Array.prototype.slice.call(container.children);
  }

  function lbRender(){
    var s = st.slides[st.idx]; if (!s) return;
    LB.img.src = url(s.src); LB.img.alt = s.alt || '';
    if (st.dotEls) st.dotEls.forEach(function(d, i){ d.classList.toggle('is-active', i === st.idx); });
  }
  function lbGo(n){
    st.idx = (n + st.slides.length) % st.slides.length;
    lbRender();
    if (st.onChange) st.onChange(st.idx);
  }
  function lbOpen(slides, idx, subtitle, onChange){
    st.slides = slides; st.idx = idx; st.onChange = onChange; st.focus = document.activeElement;
    LB.subtitle.textContent = subtitle || '';
    var multi = slides.length > 1;
    LB.navs.forEach(function(n){ n.style.display = multi ? '' : 'none'; });
    LB.dots.style.display = multi ? '' : 'none';
    st.dotEls = multi ? makeDots(LB.dots, slides.length) : null;
    lbRender();
    LB.root.hidden = false;
    document.body.style.overflow = 'hidden';
    LB.close.focus({ preventScroll: true });
  }
  function lbClose(){
    LB.root.hidden = true;
    document.body.style.overflow = '';
    if (st.focus && st.focus.focus) st.focus.focus({ preventScroll: true });
  }

  function buildLightbox(){
    var root = document.createElement('div');
    root.className = 'ch1-lightbox';
    root.id = 'cs-lightbox';
    root.hidden = true;
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'cs-lightbox-subtitle');
    root.innerHTML =
      '<button type="button" class="ch1-lightbox-close" aria-label="Close enlarged view">&times;</button>' +
      '<p class="ch1-lightbox-subtitle" id="cs-lightbox-subtitle" aria-live="polite"></p>' +
      '<button type="button" class="ch1-lightbox-nav ch1-lightbox-prev" aria-label="Previous image"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="15,18 9,12 15,6"/></svg></button>' +
      '<img class="ch1-lightbox-img" src="" alt="" />' +
      '<button type="button" class="ch1-lightbox-nav ch1-lightbox-next" aria-label="Next image"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="9,18 15,12 9,6"/></svg></button>' +
      '<div class="ch1-carousel-dots ch1-lightbox-dots" aria-hidden="true"></div>';
    document.body.appendChild(root);

    LB.root = root;
    LB.img = root.querySelector('.ch1-lightbox-img');
    LB.close = root.querySelector('.ch1-lightbox-close');
    LB.prev = root.querySelector('.ch1-lightbox-prev');
    LB.next = root.querySelector('.ch1-lightbox-next');
    LB.subtitle = root.querySelector('.ch1-lightbox-subtitle');
    LB.dots = root.querySelector('.ch1-lightbox-dots');
    LB.navs = [LB.prev, LB.next];

    root.addEventListener('click', function(e){ if (e.target === root) lbClose(); });
    LB.close.addEventListener('click', lbClose);
    LB.prev.addEventListener('click', function(e){ e.stopPropagation(); lbGo(st.idx - 1); });
    LB.next.addEventListener('click', function(e){ e.stopPropagation(); lbGo(st.idx + 1); });
    LB.dots.addEventListener('click', function(e){
      var d = e.target.closest('.ch1-dot'); if (!d) return;
      e.stopPropagation();
      lbGo(Array.prototype.indexOf.call(LB.dots.children, d));
    });
    document.addEventListener('keydown', function(e){
      if (LB.root.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); lbClose(); }
      else if (e.key === 'ArrowLeft'  && st.slides.length > 1) { e.preventDefault(); lbGo(st.idx - 1); }
      else if (e.key === 'ArrowRight' && st.slides.length > 1) { e.preventDefault(); lbGo(st.idx + 1); }
    });
  }

  /* ── Carousel: prev/next + dots + click-to-zoom. Slide set is swappable
       (setSlides) so tabbed concept galleries can share one instance. ── */
  function makeCarousel(root, slides, subtitle){
    var img   = root.querySelector('.ch1-carousel-img');
    var dotsC = root.querySelector('.ch1-carousel-dots');
    var prev  = root.querySelector('[data-dir="prev"]');
    var next  = root.querySelector('[data-dir="next"]');
    var idx = 0, dots = [];

    function render(){
      var s = slides[idx]; if (!s) return;
      img.src = url(s.src); img.alt = s.alt || '';
      dots.forEach(function(d, i){ d.classList.toggle('is-active', i === idx); });
    }
    function go(n){ idx = (n + slides.length) % slides.length; render(); }
    function open(){ lbOpen(slides, idx, subtitle, function(i){ go(i); }); }

    if (prev) prev.addEventListener('click', function(){ go(idx - 1); });
    if (next) next.addEventListener('click', function(){ go(idx + 1); });
    img.addEventListener('click', open);
    img.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

    dots = dotsC ? makeDots(dotsC, slides.length) : [];
    render();

    return {
      setSlides: function(nextSlides, nextSubtitle){
        slides = nextSlides; subtitle = nextSubtitle; idx = 0;
        dots = dotsC ? makeDots(dotsC, slides.length) : [];
        render();
      }
    };
  }

  /* ── Single image: zoom only ── */
  function initSingle(el){
    var img = el.querySelector('.ch1-carousel-img'); if (!img) return;
    var subtitle = el.getAttribute('data-subtitle') || '';
    function open(){ lbOpen([{ src: img.getAttribute('src'), alt: img.alt }], 0, subtitle, null); }
    img.addEventListener('click', open);
    img.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  }

  /* ── Tabbed concept gallery: cards swap the active carousel's slide set ── */
  function initTabbed(group){
    var root = document.getElementById(group.carousel); if (!root) return;
    var tabs = group.tabs || []; if (!tabs.length) return;
    var placeholder = group.placeholder ? document.getElementById(group.placeholder) : null;
    var captionEl   = group.caption ? document.getElementById(group.caption) : null;
    var subEl       = root.querySelector('.ch1-carousel-subtitle');
    var car   = makeCarousel(root, tabs[0].slides, tabs[0].subtitle);
    var cards = tabs.map(function(t){ return document.getElementById(t.card); });

    function activate(i){
      var t = tabs[i];
      cards.forEach(function(c, j){ if (c) c.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      if (placeholder) placeholder.hidden = true;
      root.hidden = false;
      if (subEl) subEl.textContent = t.subtitle || '';
      if (captionEl) captionEl.textContent = t.caption || '';
      car.setSlides(t.slides, t.subtitle);
    }
    cards.forEach(function(c, i){
      if (!c) return;
      c.addEventListener('click', function(){ activate(i); });
      c.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(i); } });
    });
    activate(0);
  }

  function init(){
    if (!document.querySelector('.ch1-carousel, .ch1-concept-media[data-subtitle]')) return;
    buildLightbox();

    var map = CFG.carousels || {};
    Object.keys(map).forEach(function(id){
      var root = document.getElementById(id); if (!root) return;
      var cfg = map[id];
      var subEl = root.querySelector('.ch1-carousel-subtitle');
      var subtitle = cfg.subtitle != null ? cfg.subtitle : (subEl ? subEl.textContent : '');
      makeCarousel(root, cfg.slides, subtitle);
    });

    (CFG.tabbed || []).forEach(initTabbed);

    Array.prototype.forEach.call(
      document.querySelectorAll('.ch1-concept-media[data-subtitle]'),
      initSingle
    );
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
