/* ═══════════════════════════════════════════════
   LYON HUANG — SHARED FOOTER
   Injects the footer into <div id="site-footer" data-base="…"> and wires
   "Back to top". Single source of truth for all pages.
   data-base: "" on the homepage, "../" on pages one level deep.
   Load `defer`.
   ═══════════════════════════════════════════════ */
(function(){
  var mount=document.getElementById('site-footer');
  if(!mount) return;
  var base=mount.getAttribute('data-base')||'';
  var isHome=base==='';
  var home=isHome ? '#hero' : base+'index.html';
  var year=new Date().getFullYear(); // auto-increments on Jan 1

  // the back-to-top arrow is drawn in CSS (mask-based) so an orange fill can wipe up through it
  mount.innerHTML=''
    +'<footer>'
    +  '<a class="footer-copy" href="'+home+'"><span class="footer-c">&#169;</span> '+year+' LYON HUANG</a>'
    +  '<div class="footer-links">'
    +    '<a class="scroll-cue scroll-cue--up" href="#top">Back to top'
    +      '<span class="scroll-cue-arrow" aria-hidden="true"></span>'
    +    '</a>'
    +  '</div>'
    +'</footer>';

  var back=mount.querySelector('.scroll-cue');
  if(back){
    back.addEventListener('click',function(e){
      e.preventDefault();
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }
})();
