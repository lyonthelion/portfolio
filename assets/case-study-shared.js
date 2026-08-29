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
