/* ═══════════════════════════════════════════════
   LYON HUANG — SHARED NAV
   Injects the nav + overflow menu into <div id="site-nav" data-base="…">
   and wires behavior. Single source of truth for all pages.
   data-base: "" on the homepage, "../" on pages one level deep.
   Load `defer`, BEFORE nav-active.js.
   ═══════════════════════════════════════════════ */
(function(){
  var mount=document.getElementById('site-nav');
  if(!mount) return;

  var base=mount.getAttribute('data-base')||'';
  var isHome=base==='';
  var RESUME='https://drive.google.com/file/d/1MvmpHLzYLWzH1L3VaeXqGhEyqR0yp_MD/view?usp=sharing';
  function sec(id){ return isHome ? '#'+id : base+'index.html#'+id; }
  var logoHref=isHome ? '#hero' : base+'index.html';

  // Resume sits first (a standalone external link) so the in-page scroll-spy
  // items — about/work/skills/contact — stay contiguous and the active
  // underline doesn't hop over it while scrolling.
  var linksHTML=''
    +'<li><a href="'+RESUME+'" target="_blank" rel="noopener">Resume</a></li>'
    +'<li><a href="'+sec('about')+'" data-nav="about">About</a></li>'
    +'<li><a href="'+sec('work')+'" data-nav="work">Work</a></li>'
    +'<li><a href="'+sec('skills')+'" data-nav="skills">Skills</a></li>'
    +'<li><a href="'+sec('contact')+'" data-nav="contact">Contact</a></li>';

  mount.innerHTML=''
    +'<nav id="nav">'
    +  '<a class="nav-logo" href="'+logoHref+'">LH<span>.</span></a>'
    +  '<ul class="nav-links">'+linksHTML+'</ul>'
    +  '<button class="nav-toggle" id="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-overlay">'
    +    '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>'
    +  '</button>'
    +'</nav>'
    +'<div class="nav-overlay" id="nav-overlay" aria-hidden="true">'
    +  '<ul class="nav-overlay-links">'+linksHTML+'</ul>'
    +'</div>';

  var nav=document.getElementById('nav');
  var toggle=document.getElementById('nav-toggle');
  var overlay=document.getElementById('nav-overlay');

  // scrolled state (was previously inline per-page)
  function onScroll(){ nav.classList.toggle('scrolled', window.scrollY>60); }
  window.addEventListener('scroll',onScroll,{passive:true});
  onScroll();
  // (cursor-hover for nav links is handled by the delegated listener in base.js)

  // OVERFLOW MENU: hamburger toggles full-screen overlay
  var links=overlay.querySelectorAll('a');
  function setOpen(open){
    toggle.classList.toggle('open',open);
    overlay.classList.toggle('open',open);
    document.body.classList.toggle('menu-open',open);
    toggle.setAttribute('aria-expanded',open?'true':'false');
    toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
    overlay.setAttribute('aria-hidden',open?'false':'true');
    if(open){ if(links[0]) links[0].focus(); }
    else{ toggle.focus(); }
  }
  toggle.addEventListener('click',function(){ setOpen(!overlay.classList.contains('open')); });
  links.forEach(function(a){ a.addEventListener('click',function(){ setOpen(false); }); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&overlay.classList.contains('open')) setOpen(false); });
  var mq=window.matchMedia('(min-width:481px)');
  mq.addEventListener('change',function(e){ if(e.matches&&overlay.classList.contains('open')) setOpen(false); });
})();
