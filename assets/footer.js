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

  // the back-to-top arrow is drawn in CSS (mask-based) so an orange fill can wipe up through it
  mount.innerHTML=''
    +'<footer>'
    +  '<a class="footer-copy" href="'+home+'">&#169; 2026 Lyon Huang</a>'
    +  '<div class="footer-links">'
    +    '<a class="footer-back" href="#top">Back to top'
    +      '<span class="footer-back-arrow" aria-hidden="true"></span>'
    +    '</a>'
    +  '</div>'
    +'</footer>';

  var back=mount.querySelector('.footer-back');
  if(back){
    back.addEventListener('click',function(e){
      e.preventDefault();
      window.scrollTo({top:0,behavior:'smooth'});
    });
  }
})();
