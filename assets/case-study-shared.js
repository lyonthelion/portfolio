// Case-study stat count-up: animate .cs-stat .stat-num on scroll into view.
// Mirrors the homepage impact counters, but parses freeform values ("85M",
// "+72%", "5.3 hrs") instead of a data-to attribute. Values that don't start
// with a number (e.g. "Feb 2019") or whose suffix holds a digit (e.g. "14/14")
// are left untouched.
(function(){
  var nums=[].slice.call(document.querySelectorAll('.cs-stat .stat-num'));
  if(!nums.length) return;
  var reduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Parse "±<number><suffix>" → {sign, to, decimals, suffix}, or null if not countable.
  function parse(str){
    var m=/^([+\-]?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(str.trim());
    if(!m) return null;
    var suffix=m[3];
    if(/\d/.test(suffix)) return null; // skip ratios / dates like "14/14"
    var digits=m[2].replace(/,/g,'');
    var dot=digits.indexOf('.');
    return { sign:m[1], to:parseFloat(digits), decimals:dot<0?0:digits.length-dot-1, suffix:suffix };
  }

  function fmt(v,p){
    var s=p.decimals>0 ? v.toFixed(p.decimals) : ''+Math.round(v);
    if(Math.round(v)>=1000 && p.decimals===0) s=Math.round(v).toLocaleString();
    return p.sign+s+p.suffix;
  }

  function run(el,p){
    var dur=1500, t0=performance.now();
    (function step(t){
      var prog=Math.min((t-t0)/dur,1), e=1-Math.pow(1-prog,3);
      el.textContent=fmt(p.to*e,p);
      if(prog<1) requestAnimationFrame(step);
    })(performance.now());
  }

  var parsed=[];
  nums.forEach(function(el){
    var p=parse(el.textContent);
    if(p){ parsed.push({el:el,p:p}); }
  });
  if(!parsed.length) return;

  if(reduced){ parsed.forEach(function(o){ o.el.textContent=fmt(o.p.to,o.p); }); return; }

  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ run(en.target._stat.el,en.target._stat.p); io.unobserve(en.target); }
    });
  },{threshold:.5});
  parsed.forEach(function(o){ o.el.textContent=fmt(0,o.p); o.el._stat=o; io.observe(o.el); });
})();

// Hero videos: honor prefers-reduced-motion by dropping autoplay and pausing.
// Runs on every case study (was previously inline in the Disney page only, so
// the Pluto hero video ignored the setting — this fixes that too).
(function(){
  if(!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.cs-img--hero-video video').forEach(function(v){
    v.removeAttribute('autoplay');
    v.pause();
  });
})();

/* ── Custom hero-video controls: play/pause + fullscreen only ───────────
   Replaces the native controls (and their gradient scrim). Icons are white
   and the bar uses mix-blend-mode:difference (see CSS) so they invert against
   whatever the video shows, staying legible without an overlay. */
(function(){
  var videos = document.querySelectorAll('.cs-img--hero-video video');
  if(!videos.length) return;

  var ICON = {
    play:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/></svg>',
    full:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>'
  };

  videos.forEach(function(v){
    v.removeAttribute('controls');
    var inset = v.closest('.cs-hero-video-inset') || v.parentElement;
    if(!inset) return;

    var bar = document.createElement('div');
    bar.className = 'cs-video-controls';

    var playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'cs-video-btn cs-video-play';

    var fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.className = 'cs-video-btn cs-video-full';
    fsBtn.setAttribute('aria-label', 'Fullscreen');
    fsBtn.innerHTML = ICON.full;

    function syncPlay(){
      var playing = !v.paused && !v.ended;
      playBtn.innerHTML = playing ? ICON.pause : ICON.play;
      playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }
    playBtn.addEventListener('click', function(){ if(v.paused) v.play(); else v.pause(); });
    v.addEventListener('play', syncPlay);
    v.addEventListener('pause', syncPlay);
    syncPlay();

    fsBtn.addEventListener('click', function(){
      if(v.requestFullscreen) v.requestFullscreen();
      else if(v.webkitEnterFullscreen) v.webkitEnterFullscreen();      // iOS Safari
      else if(v.webkitRequestFullscreen) v.webkitRequestFullscreen();
    });

    // Deter casual downloads: block the right-click "Save video as…" menu.
    v.addEventListener('contextmenu', function(e){ e.preventDefault(); });

    bar.appendChild(playBtn);
    bar.appendChild(fsBtn);
    inset.appendChild(bar);
  });
})();

/* ── Sticky chapter subnav ─────────────────────────────────────────────
   Clones the in-page .toc-links into a slim bar fixed under the site nav.
   Reveals it once the TOC scrolls out of view and highlights the chapter
   currently on screen (scroll-spy). No per-page markup needed. */
(function(){
  var toc = document.querySelector('.toc');
  var tocLinks = toc && toc.querySelector('.toc-links');
  if(!tocLinks) return;
  var anchors = [].slice.call(tocLinks.querySelectorAll('a[href^="#"]'));
  if(!anchors.length) return;

  var mainNav = document.querySelector('nav');

  var bar = document.createElement('nav');
  bar.className = 'cs-subnav';
  bar.setAttribute('aria-label', 'Chapters');
  var inner = document.createElement('div');
  inner.className = 'cs-subnav-inner';

  var links = anchors.map(function(a){
    var l = document.createElement('a');
    l.href = a.getAttribute('href');
    l.textContent = a.textContent.trim();
    inner.appendChild(l);
    return l;
  });
  bar.appendChild(inner);
  document.body.appendChild(bar);

  // Real, tappable scroll arrows at each edge (no per-page markup needed).
  function makeArrow(dir){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cs-subnav-arrow cs-subnav-arrow-' + (dir < 0 ? 'left' : 'right');
    b.setAttribute('aria-label', dir < 0 ? 'Scroll chapters left' : 'Scroll chapters right');
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="' + (dir < 0 ? '15 18 9 12 15 6' : '9 18 15 12 9 6') + '"/></svg>';
    b.addEventListener('click', function(){ inner.scrollBy({ left: dir * inner.clientWidth * 0.7, behavior: 'smooth' }); });
    return b;
  }
  bar.appendChild(makeArrow(-1));
  bar.appendChild(makeArrow(1));

  // Overflow state: reveal the arrow that can still scroll; keep the active
  // chapter centred as scroll-spy moves it.
  function horizontallyScrollable(){ return inner.scrollWidth - inner.clientWidth > 4; }
  function updateArrows(){
    if(!horizontallyScrollable()){ bar.classList.remove('can-left', 'can-right'); return; }
    var max = inner.scrollWidth - inner.clientWidth;
    bar.classList.toggle('can-left', inner.scrollLeft > 4);
    bar.classList.toggle('can-right', inner.scrollLeft < max - 4);
  }
  function centerActive(link){
    if(!link || !horizontallyScrollable()) return;
    var target = link.offsetLeft - (inner.clientWidth - link.offsetWidth) / 2;
    inner.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }
  inner.addEventListener('scroll', updateArrows, {passive:true});
  window.addEventListener('resize', updateArrows, {passive:true});
  window.addEventListener('load', updateArrows);
  updateArrows();

  // Publish the (fixed) site-nav height so CSS can offset both layouts.
  function positionBar(){
    bar.style.setProperty('--cs-nav-h', (mainNav ? mainNav.offsetHeight : 56) + 'px');
  }
  positionBar();
  window.addEventListener('resize', positionBar, {passive:true});
  window.addEventListener('load', positionBar);

  // Reveal the bar once the in-page TOC has scrolled up past the nav.
  function onScroll(){
    var navH = mainNav ? mainNav.offsetHeight : 56;
    bar.classList.toggle('is-visible', toc.getBoundingClientRect().bottom < navH + 8);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // Scroll-spy: mark the chapter currently in view as active.
  var sections = links
    .map(function(l){ return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);
  if('IntersectionObserver' in window && sections.length){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          var id = '#' + e.target.id;
          var active = null;
          links.forEach(function(l){
            var on = l.getAttribute('href') === id;
            l.classList.toggle('is-active', on);
            if(on){ active = l; }
          });
          centerActive(active);
          updateArrows();
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function(s){ io.observe(s); });
  }
})();

/* ── Before / after comparison slider ──────────────────────────────────
   Drag (pointer) or arrow-key the divider to reveal each side. The split
   position lives in the --pos custom property; markup starts it at 50%. */
(function(){
  var comps = document.querySelectorAll('.cs-compare');
  if(!comps.length) return;
  comps.forEach(function(c){
    var dragging = false;
    function setPct(p){
      p = Math.min(100, Math.max(0, p));
      c.style.setProperty('--pos', p + '%');
      c.setAttribute('aria-valuenow', Math.round(p));
    }
    function fromX(clientX){
      var r = c.getBoundingClientRect();
      setPct((clientX - r.left) / r.width * 100);
    }
    c.addEventListener('pointerdown', function(e){
      dragging = true;
      try { c.setPointerCapture(e.pointerId); } catch(_){}
      fromX(e.clientX);
    });
    c.addEventListener('pointermove', function(e){ if(dragging) fromX(e.clientX); });
    function stop(e){ if(dragging){ dragging = false; try { c.releasePointerCapture(e.pointerId); } catch(_){} } }
    c.addEventListener('pointerup', stop);
    c.addEventListener('pointercancel', stop);
    c.addEventListener('keydown', function(e){
      var cur = parseFloat(c.style.getPropertyValue('--pos')) || 50;
      if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){ setPct(cur - 2); e.preventDefault(); }
      else if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){ setPct(cur + 2); e.preventDefault(); }
      else if(e.key === 'Home'){ setPct(0); e.preventDefault(); }
      else if(e.key === 'End'){ setPct(100); e.preventDefault(); }
    });

    // Carousel mode: cycle through before/after pairs (prev/next + dots).
    // Each pair swaps the two image sources and resets the divider to 50%.
    var pairsAttr = c.getAttribute('data-pairs');
    if(!pairsAttr) return;
    var pairs; try { pairs = JSON.parse(pairsAttr); } catch(_){ return; }
    if(!pairs.length) return;
    var base = c.getAttribute('data-base') || '';
    function url(s){ return /^(https?:)?\/\//.test(s) ? s : base + s; }
    var afterImg  = c.querySelector('.cs-compare-after-img');
    var beforeImg = c.querySelector('.cs-compare-before-img');
    var figure = c.closest('figure');
    var nav    = figure && figure.querySelector('.cs-compare-nav');
    var dotsC  = nav && nav.querySelector('.ch1-carousel-dots');
    var prev   = nav && nav.querySelector('[data-dir="prev"]');
    var next   = nav && nav.querySelector('[data-dir="next"]');
    var idx = 0, dots = [];
    function render(){
      var p = pairs[idx];
      afterImg.src  = url(p.after);  afterImg.alt  = (p.alt || '') + ' — after redesign';
      beforeImg.src = url(p.before); beforeImg.alt = (p.alt || '') + ' — before redesign';
      setPct(50);
      dots.forEach(function(d, i){ d.classList.toggle('is-active', i === idx); });
    }
    function go(n){ idx = (n + pairs.length) % pairs.length; render(); }
    if(dotsC){
      pairs.forEach(function(_, i){
        var s = document.createElement('span');
        s.className = 'ch1-dot' + (i === 0 ? ' is-active' : '');
        dotsC.appendChild(s);
      });
      dots = [].slice.call(dotsC.children);
      dotsC.addEventListener('click', function(e){
        var d = e.target.closest('.ch1-dot'); if(d) go(dots.indexOf(d));
      });
    }
    if(prev) prev.addEventListener('click', function(){ go(idx - 1); });
    if(next) next.addEventListener('click', function(){ go(idx + 1); });
    render();
  });
})();
