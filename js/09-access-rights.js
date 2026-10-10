(()=>{'use strict';
const $=id=>document.getElementById(id),cl=()=>window.portalCloudClient;
let me=null,users=[],currentUser=null;
const rank={none:0,read:1,edit:2,admin:3};
function can(mod,level='read'){return !!me?.enabled&&(me.is_super_admin||rank[me[mod]||'none']>=rank[level])}
window.portalCan=can;
async function loadMe(){const c=cl();if(!c)return null;const {data:{user}}=await c.auth.getUser();currentUser=user||null;if(!user){me=null;apply();return null}const {data,error}=await c.from('portal_user_permissions').select('*').eq('user_id',user.id).maybeSingle();if(error)console.warn(error);me=data||null;apply();return me}
function apply(){
 const logged=!!me?.enabled; const gate=$('accessGate');if(gate){gate.hidden=!!currentUser;gate.style.display=currentUser?'none':'flex'}
 document.querySelectorAll('#portalHome [data-module]').forEach(b=>{const m=b.dataset.module;let ok=m==='annuaire'?can('annuaire'):m==='settings'?can('parametres'):m==='pilotage'?(can('actions')||can('reunions')):m==='library'?can('bibliotheque'):true;b.hidden=currentUser?!ok:false});
 const write=can('annuaire','edit'); if($('newContact'))$('newContact').hidden=!write;
 if($('contactDialog'))$('contactDialog').classList.toggle('portal-readonly',!write);
 const accessBtn=document.querySelector('[data-settings-category="acces"]');if(accessBtn)accessBtn.hidden=!can('parametres','admin');
}
window.portalApplyAccess=apply;
async function listUsers(){if(!can('parametres','admin'))return;const {data,error}=await cl().from('portal_user_permissions').select('*').order('email');if(error)throw error;users=data||[];renderUsers()}
function sel(v,field,id){return `<select data-right="${field}" data-user="${id}">${['none','read','edit','admin'].map(x=>`<option value="${x}" ${x===v?'selected':''}>${{none:'Aucun',read:'Lecture',edit:'Édition',admin:'Admin'}[x]}</option>`).join('')}</select>`}
function renderUsers(){const h=$('accessUsers');if(!h)return;h.innerHTML=users.map(u=>`<div class="access-user-row"><div><strong>${u.email}</strong>${u.display_name?`<small>${u.display_name}</small>`:''}</div><label>Annuaire${sel(u.annuaire,'annuaire',u.user_id)}</label><label>Actions${sel(u.actions,'actions',u.user_id)}</label><label>Bibliothèque${sel(u.bibliotheque,'bibliotheque',u.user_id)}</label><label>Réunions${sel(u.reunions,'reunions',u.user_id)}</label><label>Paramètres${sel(u.parametres,'parametres',u.user_id)}</label><label class="access-enabled"><input type="checkbox" data-enabled="${u.user_id}" ${u.enabled?'checked':''} ${u.is_super_admin?'disabled':''}> Actif</label></div>`).join('')||'<p class="muted">Aucun utilisateur.</p>'}
async function saveUser(id){const u=users.find(x=>x.user_id===id);if(!u)return;document.querySelectorAll(`[data-user="${id}"]`).forEach(s=>u[s.dataset.right]=s.value);const cb=document.querySelector(`[data-enabled="${id}"]`);if(cb&&!u.is_super_admin)u.enabled=cb.checked;const {error}=await cl().from('portal_user_permissions').update({enabled:u.enabled,annuaire:u.annuaire,actions:u.actions,bibliotheque:u.bibliotheque,reunions:u.reunions,parametres:u.parametres,updated_at:new Date().toISOString()}).eq('user_id',id);if(error)throw error}
async function invite(){const email=$('inviteEmail').value.trim();if(!email)return alert('Indiquez une adresse e-mail.');const btn=$('inviteUser');btn.disabled=true;try{const {data,error}=await cl().functions.invoke('invite-portal-user',{body:{email,displayName:$('inviteName').value.trim(),redirectTo:location.origin+location.pathname,rights:{annuaire:$('inviteAnnuaire').value,actions:'none',bibliotheque:'none',reunions:'none',parametres:'none'}}});if(error)throw error;if(!data?.ok)throw new Error(data?.error||'Invitation impossible');$('inviteEmail').value='';$('inviteName').value='';alert('Invitation envoyée.');await listUsers()}catch(e){alert('Invitation impossible : '+(e.message||e))}finally{btn.disabled=false}}
document.addEventListener('DOMContentLoaded',()=>{
 const invited=/type=invite/.test(location.hash)||/type=invite/.test(location.search);
 loadMe().then(()=>{if(invited&&currentUser)$('firstPasswordDialog')?.showModal()});
 cl()?.auth.onAuthStateChange((event)=>{setTimeout(loadMe,0);if((event==='SIGNED_IN'||event==='PASSWORD_RECOVERY')&&(/type=invite/.test(location.hash)||/type=invite/.test(location.search)))setTimeout(()=>$('firstPasswordDialog')?.showModal(),100)});
 $('gateLogin')?.addEventListener('click',async()=>{const m=$('gateMessage');m.textContent='Connexion…';const {error}=await cl().auth.signInWithPassword({email:$('gateEmail').value.trim(),password:$('gatePassword').value});m.textContent=error?error.message:''});
 $('firstPasswordForm')?.addEventListener('submit',async e=>{e.preventDefault();const a=$('firstPassword').value,b=$('firstPassword2').value,m=$('firstPasswordMessage');if(a!==b){m.textContent='Les deux mots de passe sont différents.';return}const {error}=await cl().auth.updateUser({password:a});if(error){m.textContent=error.message;return}history.replaceState(null,'',location.pathname+location.search.replace(/([?&])type=invite(&|$)/,'$1').replace(/[?&]$/,''));$('firstPasswordDialog').close();m.textContent=''});
 $('inviteUser')?.addEventListener('click',invite);$('accessUsers')?.addEventListener('change',async e=>{let id=e.target.dataset.user||e.target.dataset.enabled;if(!id)return;try{await saveUser(id)}catch(x){alert('Enregistrement impossible : '+x.message);await listUsers()}});window.portalLoadAccessUsers=listUsers});
})();
