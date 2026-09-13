/* ═══════════════════════════════════════════════
   LYON HUANG — SHARED COUNT-UP
   One rAF + IntersectionObserver count-up engine for both counter styles:
     • Homepage impact counters — .impact-num
         (values from data-to / data-since, unit from data-suffix)
     • Case-study stat bar       — .cs-stat .stat-num
         (values parsed from freeform text: "85M", "+72%", "5.3 hrs")
   Was two near-identical copies (index.html inline + case-study-shared.js);
   the easing (1.5s cubic ease-out), the scroll gate, and reduced-motion
   handling are now shared. Each counter style keeps only its own value logic.
   Load `defer`. A page runs only the block whose elements it actually has.
   ═══════════════════════════════════════════════ */
(function(){
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Shared tween: 0 → `to` over 1.5s, cubic ease-out; render(value) updates the DOM.
  function tween(to, render){
    var dur = 1500, t0 = performance.now();
    (function step(t){
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      render(to * e);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  // Shared scroll gate: run cb(el) once when el first crosses 50% into view.
  function onView(els, cb){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ cb(en.target); io.unobserve(en.target); } });
    }, { threshold: .5 });
    els.forEach(function(el){ io.observe(el); });
  }

  // ── A) Homepage impact counters (data-to / data-since / data-suffix) ──
  (function(){
    var nums = [].slice.call(document.querySelectorAll('.impact-num'));
    if (!nums.length) return;
    // resolve any auto-counting stats (years since a start year) to a concrete data-to
    nums.forEach(function(n){ var s = n.getAttribute('data-since'); if (s){ n.setAttribute('data-to', Math.max(1, new Date().getFullYear() - (+s))); } });
    function fmt(n){ return n >= 1000 ? n.toLocaleString() : '' + n; }
    function finalText(n){ return fmt(+n.getAttribute('data-to')) + (n.getAttribute('data-suffix') || ''); }
    if (reduced){ nums.forEach(function(n){ n.textContent = finalText(n); }); return; }
    onView(nums, function(n){
      var to = +n.getAttribute('data-to'), suf = n.getAttribute('data-suffix') || '';
      tween(to, function(v){ n.textContent = fmt(Math.round(v)) + suf; });
    });
  })();

  // ── B) Case-study stat bar (freeform text) ──
  (function(){
    var nums = [].slice.call(document.querySelectorAll('.cs-stat .stat-num'));
    if (!nums.length) return;

    // Parse "±<number><suffix>" → {sign, to, decimals, suffix}, or null if not countable.
    // Values that don't start with a number ("Feb 2019") or whose suffix holds a
    // digit ("14/14") are left untouched.
    function parse(str){
      var m = /^([+\-]?)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(str.trim());
      if (!m) return null;
      var suffix = m[3];
      if (/\d/.test(suffix)) return null; // skip ratios / dates like "14/14"
      var digits = m[2].replace(/,/g, '');
      var dot = digits.indexOf('.');
      return { sign: m[1], to: parseFloat(digits), decimals: dot < 0 ? 0 : digits.length - dot - 1, suffix: suffix };
    }
    function fmt(v, p){
      var s = p.decimals > 0 ? v.toFixed(p.decimals) : '' + Math.round(v);
      if (Math.round(v) >= 1000 && p.decimals === 0) s = Math.round(v).toLocaleString();
      return p.sign + s + p.suffix;
    }

    var parsed = [];
    nums.forEach(function(el){ var p = parse(el.textContent); if (p){ el._cu = p; parsed.push(el); } });
    if (!parsed.length) return;
    if (reduced){ parsed.forEach(function(el){ el.textContent = fmt(el._cu.to, el._cu); }); return; }
    parsed.forEach(function(el){ el.textContent = fmt(0, el._cu); });
    onView(parsed, function(el){ tween(el._cu.to, function(v){ el.textContent = fmt(v, el._cu); }); });
  })();
})();
