/* MODULE 05 : ergonomie mobile. Ne modifie pas les données ni les fonctions métier. */
(()=>{'use strict';
const nav=document.getElementById('mobileBottomNav');if(!nav)return;
const $=id=>document.getElementById(id);
function update(){let section= !$('portalHome').hidden?'home':!$('portalLibrary').hidden?'library':'pilotage';nav.querySelectorAll('button[data-mobile]').forEach(b=>{if(b.dataset.mobile===section)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
nav.addEventListener('click',e=>{const b=e.target.closest('button[data-mobile]');if(!b)return;const v=b.dataset.mobile;
 if(v==='home')$('portalBack').click();
 else if(v==='pilotage')document.querySelector('#portalHome .portal-tile[data-module="pilotage"]').click();
 else if(v==='library')document.querySelector('#portalHome .portal-tile[data-module="library"]').click();
 else if(v==='new'){if($('portalPilotage').hidden)document.querySelector('#portalHome .portal-tile[data-module="pilotage"]').click();$('addTop').click()}
 update();});
['portalBack','libraryBack'].forEach(id=>$(id).addEventListener('click',()=>requestAnimationFrame(update)));
document.querySelectorAll('#portalHome .portal-tile[data-module]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(update)));
update();
})();
