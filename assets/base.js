/* ═══════════════════════════════════════════════
   LYON HUANG — SHARED BASE BEHAVIOR
   Custom cursor, delegated hover, reveal-on-scroll, smooth-scroll.
   Loaded on every page (defer, before nav.js). Replaces the copies
   that used to live inline in each page.
   ═══════════════════════════════════════════════ */
(function(){
  // ── CURSOR follower ──
  // Position is mirrored to window.mx/window.my so page canvases (hero/contact
  // shape fields on index) can read the cursor for their magnetism effect.
  var dot=document.getElementById('cursor-dot'), ring=document.getElementById('cursor-ring');
  var mx=0,my=0,rx=0,ry=0;
  window.mx=0; window.my=0;
  document.addEventListener('mousemove',function(e){ mx=e.clientX; my=e.clientY; window.mx=mx; window.my=my; });
  if(dot&&ring){
    (function loop(){
      dot.style.left=mx+'px'; dot.style.top=my+'px';
      rx+=(mx-rx)*.12; ry+=(my-ry)*.12;
      ring.style.left=rx+'px'; ring.style.top=ry+'px';
      requestAnimationFrame(loop);
    })();
  }

  // ── CURSOR-HOVER: one delegated handler for every interactive element ──
  // (replaces the per-element mouseenter/mouseleave bindings that were copied
  //  across pages — disney had ~35 of them). Works for injected nav links too.
  var HOVER_SEL='a, button, [role="button"], [tabindex], .project-card, .skill-tag';
  document.addEventListener('mouseover',function(e){
    if(e.target.closest && e.target.closest(HOVER_SEL)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout',function(e){
    if(!(e.target.closest && e.target.closest(HOVER_SEL))) return;
    var to=e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest(HOVER_SEL) : null;
    if(!to) document.body.classList.remove('cursor-hover'); // only clear when not entering another interactive element
  });

  // ── REVEAL on scroll ──
  var obs=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in-view'); obs.unobserve(e.target); } });
  },{threshold:.12});
  document.querySelectorAll('.reveal,.reveal-group').forEach(function(el){ obs.observe(el); });

  // ── SMOOTH SCROLL for in-page anchors (delegated, so injected nav links work) ──
  document.addEventListener('click',function(e){
    var a=e.target.closest && e.target.closest('a[href^="#"]');
    if(!a) return;
    var id=a.getAttribute('href');
    if(id.length>1){ var t=document.querySelector(id); if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth'}); } }
  });
})();
