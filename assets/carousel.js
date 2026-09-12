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

  var REG = {};   // id → carousel/single API, used to group before/after pairs

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

  /* ── Carousel controls (prev + dots + next). Inert without JS — the dots are
       JS-built and the buttons do nothing until wired here — so they're generated
       rather than duplicated into every carousel's markup. The subtitle + first
       <img> stay in the page HTML so the carousel still paints (and the image
       still loads) before this deferred script runs. ── */
  function buildControls(){
    var c = document.createElement('div');
    c.className = 'ch1-carousel-controls';
    c.innerHTML =
      '<button type="button" class="ch1-carousel-btn" data-dir="prev" aria-label="Previous slide"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15,18 9,12 15,6"/></svg></button>' +
      '<div class="ch1-carousel-dots" aria-hidden="true"></div>' +
      '<button type="button" class="ch1-carousel-btn" data-dir="next" aria-label="Next slide"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9,18 15,12 9,6"/></svg></button>';
    return c;
  }

  /* ── Carousel: prev/next + dots + click-to-zoom. Slide set is swappable
       (setSlides) so tabbed concept galleries can share one instance. ── */
  function makeCarousel(root, slides, subtitle){
    var img   = root.querySelector('.ch1-carousel-img');
    if (!root.querySelector('.ch1-carousel-controls')) root.appendChild(buildControls());
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

    var viewport = root.querySelector('.ch1-carousel-viewport');
    if (prev) prev.addEventListener('click', function(){ go(idx - 1); });
    if (next) next.addEventListener('click', function(){ go(idx + 1); });
    // Open the lightbox from anywhere in the image frame (incl. the padding /
    // the "Zoom" hint corner), not just the image pixels. api.onZoom is mutable
    // so pairs (below) can redirect it to a combined before+after set.
    (viewport || img).addEventListener('click', function(){ api.onZoom(); });
    img.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.onZoom(); } });

    dots = dotsC ? makeDots(dotsC, slides.length) : [];
    render();

    var api = {
      onZoom: open,
      index: function(){ return idx; },
      slides: function(){ return slides; },
      subtitle: function(){ return subtitle; },
      setSlides: function(nextSlides, nextSubtitle){
        slides = nextSlides; subtitle = nextSubtitle; idx = 0;
        dots = dotsC ? makeDots(dotsC, slides.length) : [];
        render();
      }
    };
    return api;
  }

  /* ── Single image: zoom only ── */
  function initSingle(el){
    var img = el.querySelector('.ch1-carousel-img'); if (!img) return null;
    var subtitle = el.getAttribute('data-subtitle') || '';
    var slides = [{ src: img.getAttribute('src'), alt: img.alt }];
    function open(){ lbOpen(slides, 0, subtitle, null); }
    (el.querySelector('.ch1-carousel-viewport') || img).addEventListener('click', function(){ api.onZoom(); });
    img.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); api.onZoom(); } });
    var api = {
      onZoom: open,
      index: function(){ return 0; },
      slides: function(){ return slides; },
      subtitle: function(){ return subtitle; }
    };
    return api;
  }

  /* ── Paired galleries (review #12): a before/after pair opens ONE lightbox
       spanning both sets, so you can swipe before → after without closing and
       re-opening. Each member keeps its own in-page carousel; only zoom merges.
       Config: pairs:[{ members:[id, id], subtitle? }] where id is a configured
       carousel id or a .ch1-concept-media[data-subtitle] element id. ── */
  function initPairs(pairs){
    (pairs || []).forEach(function(pair){
      var members = (pair.members || []).map(function(id){ return REG[id]; }).filter(Boolean);
      if (members.length < 2) return;
      function build(){
        var all = [], offsets = [], labels = [];
        members.forEach(function(m){ offsets.push(all.length); labels.push(m.subtitle()); all = all.concat(m.slides()); });
        return { all: all, offsets: offsets, labels: labels };
      }
      function labelFor(c, i){
        for (var m = c.offsets.length - 1; m >= 0; m--){ if (i >= c.offsets[m]) return c.labels[m]; }
        return pair.subtitle || '';
      }
      members.forEach(function(m, mi){
        m.onZoom = function(){
          var c = build();
          var start = c.offsets[mi] + m.index();
          lbOpen(c.all, start, labelFor(c, start), function(i){ LB.subtitle.textContent = labelFor(c, i); });
        };
      });
    });
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
      REG[id] = makeCarousel(root, cfg.slides, subtitle);
    });

    (CFG.tabbed || []).forEach(initTabbed);

    Array.prototype.forEach.call(
      document.querySelectorAll('.ch1-concept-media[data-subtitle]'),
      function(el){ var api = initSingle(el); if (api && el.id) REG[el.id] = api; }
    );

    initPairs(CFG.pairs);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
