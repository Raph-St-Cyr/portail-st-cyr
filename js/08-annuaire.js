(()=>{'use strict';
const $=id=>document.getElementById(id);
const LK='saintcyr.annuaire.contacts.v1',CK='saintcyr.annuaire.categories.v1',SK='saintcyr.annuaire.subcategories.v1',PK='saintcyr.annuaire.pending.v1',DK='saintcyr.annuaire.deletes.v1',RK='saintcyr.annuaire.refs.pending.v1';
const DEF=['Élus','Agents communaux','Vienne Condrieu Agglomération','Département','Services de l’État','Associations','Prestataires','Secours / sécurité','Autres'];
let contacts=[],cats=[],subs={},displayMode=localStorage.getItem('saintcyr.annuaire.display.v1')||'list';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(d))}catch{return d}};
const set=k=>new Set(read(k,[])),put=(k,x)=>localStorage.setItem(k,JSON.stringify([...x]));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){localStorage.setItem(LK,JSON.stringify(contacts));localStorage.setItem(CK,JSON.stringify(cats));localStorage.setItem(SK,JSON.stringify(subs))}
function load(){contacts=read(LK,[]);cats=read(CK,[]);subs=read(SK,{});if(!cats.length)cats=[...DEF];cats.forEach(c=>{if(!Array.isArray(subs[c]))subs[c]=[]})}
function subOptions(cat,selected=''){return '<option value="">Aucune</option>'+((subs[cat]||[]).map(s=>`<option value="${esc(s)}" ${s===selected?'selected':''}>${esc(s)}</option>`).join(''))}
function options(){
 const o=cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
 $('contactCategory').innerHTML=o;
 let cv=$('contactCategoryFilter').value;
 $('contactCategoryFilter').innerHTML='<option value="">Toutes les catégories</option>'+o;
 $('contactCategoryFilter').value=cv;
 updateSubFilter();
}
function updateSubFilter(){
 const cat=$('contactCategoryFilter').value,el=$('contactSubcategoryFilter'),old=el.value;
 const arr=cat?(subs[cat]||[]):[...new Set(cats.flatMap(c=>subs[c]||[]))].sort((a,b)=>a.localeCompare(b,'fr',{sensitivity:'base'}));
 el.innerHTML='<option value="">Toutes les sous-catégories</option>'+arr.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
 el.value=arr.includes(old)?old:'';
}
function renderCats(){
 options();$('contactCategoryCount').textContent=`(${cats.length})`;
 $('contactCategoryRows').innerHTML=cats.map((c,i)=>{
  const rows=(subs[c]||[]).map((s,j)=>`<div class="annuaire-subcat-row"><input data-si="${i}" data-sj="${j}" value="${esc(s)}"><div class="annuaire-subcat-actions"><button type="button" data-sm="${i}" data-sj="${j}" data-dir="-1" ${j===0?'disabled':''}>↑</button><button type="button" data-sm="${i}" data-sj="${j}" data-dir="1" ${j===(subs[c]||[]).length-1?'disabled':''}>↓</button><button type="button" data-sr="${i}" data-sj="${j}">Renommer</button><button type="button" class="danger" data-sd="${i}" data-sj="${j}">Supprimer</button></div></div>`).join('');
  return `<div class="annuaire-cat-row"><input data-ci="${i}" value="${esc(c)}"><div class="annuaire-cat-actions"><button type="button" data-cm="${i}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button type="button" data-cm="${i}" data-dir="1" ${i===cats.length-1?'disabled':''}>↓</button><button type="button" data-cr="${i}">Renommer</button><button type="button" class="danger" data-cd="${i}">Supprimer</button></div></div><div class="annuaire-subcats"><strong>Sous-catégories</strong>${rows||'<p class="muted">Aucune sous-catégorie.</p>'}<div class="annuaire-subcat-add"><input data-new-sub="${i}" maxlength="80" placeholder="Nouvelle sous-catégorie"><button type="button" data-sa="${i}">+ Ajouter</button></div></div>`;
 }).join('');
}
function render(){
 renderCats();
 const q=$('contactSearch').value.trim().toLowerCase(),cat=$('contactCategoryFilter').value,sub=$('contactSubcategoryFilter').value;
 const a=contacts.filter(c=>(!cat||c.category===cat)&&(!sub||c.subcategory===sub)&&(!q||[c.lastName,c.firstName,c.organization,c.function,c.address,c.postalCode,c.city,c.category,c.subcategory].join(' ').toLowerCase().includes(q))).sort((a,b)=>{let n=(a.lastName||'').localeCompare(b.lastName||'','fr',{sensitivity:'base'});return n||((a.firstName||'').localeCompare(b.firstName||'','fr',{sensitivity:'base'}))});
 $('contactCards').className=displayMode==='list'?'annuaire-grid annuaire-list':'annuaire-grid annuaire-cards';
 $('annuaireListMode')?.classList.toggle('active',displayMode==='list');$('annuaireCardMode')?.classList.toggle('active',displayMode==='cards');
 $('contactCards').innerHTML=a.length?a.map(c=>{let n=[c.lastName,c.firstName].filter(Boolean).join(' '),t=c.mobile||c.phone||'';
  if(displayMode==='list')return `<article class="contact-card contact-row"><button type="button" class="contact-name" data-contact-edit="${c.id}">${esc(n||c.organization||'Contact')}</button><div class="contact-quick">${t?`<a href="tel:${esc(t.replace(/\s/g,''))}" aria-label="Appeler" title="Appeler"><span aria-hidden="true">☎</span></a>`:''}${c.email?`<a href="mailto:${esc(c.email)}" aria-label="Envoyer un e-mail" title="E-mail"><span aria-hidden="true">✉</span></a>`:''}</div></article>`;
  let ad=[c.address,[c.postalCode,c.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return `<article class="contact-card"><h3>${esc(n||c.organization||'Contact')}</h3><div class="contact-meta">${esc([c.category,c.subcategory,c.organization,c.function].filter(Boolean).join(' · '))}</div><div class="contact-lines">${c.phone?`<div>☎ ${esc(c.phone)}</div>`:''}${c.mobile?`<div>📱 ${esc(c.mobile)}</div>`:''}${c.email?`<div>✉ ${esc(c.email)}</div>`:''}${ad?`<div>📍 ${esc(ad)}</div>`:''}</div><div class="contact-actions">${t?`<a href="tel:${esc(t.replace(/\s/g,''))}" aria-label="Appeler" title="Appeler"><span aria-hidden="true">☎</span></a>`:''}${c.email?`<a href="mailto:${esc(c.email)}" aria-label="Envoyer un e-mail" title="E-mail"><span aria-hidden="true">✉</span></a>`:''}<button type="button" data-contact-edit="${c.id}">Modifier</button></div></article>`}).join(''):'<p class="muted">Aucun contact.</p>';
}
function open(c={}){
 for(const [id,k] of [['contactId','id'],['contactLastName','lastName'],['contactFirstName','firstName'],['contactOrganization','organization'],['contactFunction','function'],['contactPhone','phone'],['contactMobile','mobile'],['contactEmail','email'],['contactAddress','address'],['contactPostalCode','postalCode'],['contactCity','city'],['contactNotes','notes']])$(id).value=c[k]||'';
 options();$('contactCategory').value=c.category||cats[0]||'';$('contactSubcategory').innerHTML=subOptions($('contactCategory').value,c.subcategory||'');$('deleteContact').hidden=!c.id;$('contactDialog').showModal();
}
async function client(){return window.portalCloudClient||null}
async function up(c){let cl=await client();if(!cl)return;let {data:{session}}=await cl.auth.getSession();if(!session)return;let {data:remote,error:re}=await cl.from('annuaire_contacts').select('updated_at').eq('id',c.id).maybeSingle();if(re)throw re;if(remote?.updated_at&&new Date(remote.updated_at)>new Date(c.updatedAt||0)){let p=set(PK);p.delete(c.id);put(PK,p);return}let {error}=await cl.from('annuaire_contacts').upsert({id:c.id,payload:c,updated_at:c.updatedAt},{onConflict:'id'});if(error)throw error;let p=set(PK);p.delete(c.id);put(PK,p)}
async function del(id){let cl=await client();if(!cl)return false;let {data:{session}}=await cl.auth.getSession();if(!session)return false;const deletedAt=new Date().toISOString();let {error}=await cl.from('annuaire_contacts').upsert({id,payload:{id,_deleted:true,deletedAt},updated_at:deletedAt},{onConflict:'id'});if(error)throw error;let d=set(DK);d.delete(id);put(DK,d);let p=set(PK);p.delete(id);put(PK,p);return true}
function markRefsPending(){localStorage.setItem(RK,'1')}
async function saveRefs(){markRefsPending();let cl=await client();if(!cl)return false;let {data:{session}}=await cl.auth.getSession();if(!session)return false;const t=new Date().toISOString();let {error}=await cl.from('portal_settings').upsert([{key:'annuaire_categories',value:cats,updated_at:t},{key:'annuaire_subcategories',value:subs,updated_at:t}],{onConflict:'key'});if(error){console.warn('Annuaire catégories sync',error);return false}localStorage.removeItem(RK);return true}
async function pull(){let cl=await client();if(!cl)return;let {data:{session}}=await cl.auth.getSession();if(!session)return;try{
 let refsPending=localStorage.getItem(RK)==='1';
 if(refsPending)await saveRefs();
 let {data:st,error:se}=await cl.from('portal_settings').select('key,value,updated_at').in('key',['annuaire_categories','annuaire_subcategories']);if(se)throw se;
 if(localStorage.getItem(RK)!=='1'){for(const r of st||[]){if(r.key==='annuaire_categories'&&Array.isArray(r.value)&&r.value.length)cats=r.value;if(r.key==='annuaire_subcategories'&&r.value&&typeof r.value==='object')subs=r.value}}
 cats.forEach(c=>{if(!Array.isArray(subs[c]))subs[c]=[]});
 let {data,error}=await cl.from('annuaire_contacts').select('id,payload,updated_at');if(error)throw error;
 let p=set(PK),d=set(DK),ids=new Set((data||[]).map(x=>x.id)),lm=new Map(contacts.map(x=>[x.id,x])),next=[];
 for(const r of data||[]){
   if(d.has(r.id))continue;
   if(r.payload&&r.payload._deleted){p.delete(r.id);continue}
   const local=lm.get(r.id);
   if(p.has(r.id)&&local){
     const lt=new Date(local.updatedAt||0),rt=new Date(r.updated_at||0);
     if(lt>rt){next.push(local);continue}
     p.delete(r.id)
   }
   next.push({...r.payload,id:r.id,updatedAt:r.updated_at})
 }
 for(const c of contacts)if(!ids.has(c.id)&&!d.has(c.id)&&p.has(c.id))next.push(c);
 contacts=next;put(PK,p);save();render();
 for(const id of [...d])await del(id);
 for(const id of [...p]){let c=contacts.find(x=>x.id===id);if(c)await up(c)}
 }catch(e){console.warn('Annuaire sync',e)}}
document.addEventListener('DOMContentLoaded',()=>{
 async function importAnnuaireFile(file){
 try{
  const data=JSON.parse(await file.text());
  if(data.format!=='saintcyr-annuaire-v1'||!Array.isArray(data.contacts))throw new Error('Format de fichier non reconnu.');
  const incoming=data.contacts.filter(c=>c&&c.id);
  if(!incoming.length)throw new Error('Aucun contact à importer.');
  if(!confirm(`Importer ${incoming.length} entrées dans l’annuaire ?\n\nLes contacts ayant le même identifiant seront mis à jour.`))return;
  if(Array.isArray(data.categories))for(const c of data.categories)if(c&&!cats.includes(c))cats.push(c);
  if(data.subcategories&&typeof data.subcategories==='object')for(const [c,a] of Object.entries(data.subcategories)){if(!Array.isArray(subs[c]))subs[c]=[];for(const x of (Array.isArray(a)?a:[]))if(x&&!subs[c].includes(x))subs[c].push(x)}
  const map=new Map(contacts.map(c=>[c.id,c]));
  const p=set(PK);
  for(const raw of incoming){
   const c={...raw,updatedAt:new Date().toISOString()};
   map.set(c.id,c);p.add(c.id);
  }
  contacts=[...map.values()];put(PK,p);save();render();markRefsPending();saveRefs();
  const cl=await client();let ok=0;
  if(cl){const {data:{session}}=await cl.auth.getSession();if(session){
   for(let i=0;i<incoming.length;i+=50){
    const batch=incoming.slice(i,i+50).map(raw=>{const c=contacts.find(x=>x.id===raw.id);return{id:c.id,payload:c,updated_at:c.updatedAt}});
    const {error}=await cl.from('annuaire_contacts').upsert(batch,{onConflict:'id'});if(error)throw error;ok+=batch.length;
   }
   const pp=set(PK);for(const raw of incoming)pp.delete(raw.id);put(PK,pp);
  }}
  alert(`Import terminé : ${incoming.length} entrées intégrées${ok?` et ${ok} synchronisées dans le cloud`:''}.`);
 }catch(e){console.warn('Import annuaire',e);alert('Import impossible : '+(e?.message||e))}
}
load();render();$('importAnnuaire').onclick=()=>$('importAnnuaireFile').click();$('importAnnuaireFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)importAnnuaireFile(f).finally(()=>{e.target.value=''})};$('newContact').onclick=()=>open();$('closeContact').onclick=$('cancelContact').onclick=()=>$('contactDialog').close();
 $('contactSearch').oninput=render;$('contactCategoryFilter').onchange=()=>{updateSubFilter();render()};$('contactSubcategoryFilter').onchange=render;
 $('contactCategory').onchange=()=>{$('contactSubcategory').innerHTML=subOptions($('contactCategory').value)};
 $('annuaireListMode').onclick=()=>{displayMode='list';localStorage.setItem('saintcyr.annuaire.display.v1',displayMode);render()};$('annuaireCardMode').onclick=()=>{displayMode='cards';localStorage.setItem('saintcyr.annuaire.display.v1',displayMode);render()};
 $('contactCards').onclick=e=>{let b=e.target.closest('[data-contact-edit]');if(b)open(contacts.find(c=>c.id===b.dataset.contactEdit)||{})};
 $('contactForm').onsubmit=e=>{e.preventDefault();let id=$('contactId').value||crypto.randomUUID(),old=contacts.find(c=>c.id===id)||{},c={...old,id,lastName:$('contactLastName').value.trim(),firstName:$('contactFirstName').value.trim(),category:$('contactCategory').value,subcategory:$('contactSubcategory').value,organization:$('contactOrganization').value.trim(),function:$('contactFunction').value.trim(),phone:$('contactPhone').value.trim(),mobile:$('contactMobile').value.trim(),email:$('contactEmail').value.trim(),address:$('contactAddress').value.trim(),postalCode:$('contactPostalCode').value.trim(),city:$('contactCity').value.trim(),notes:$('contactNotes').value.trim(),updatedAt:new Date().toISOString()};let i=contacts.findIndex(x=>x.id===id);i<0?contacts.push(c):contacts[i]=c;let p=set(PK);p.add(id);put(PK,p);save();$('contactDialog').close();render();up(c).catch(console.warn)};
 $('deleteContact').onclick=()=>{let id=$('contactId').value;if(!id||!confirm('Supprimer ce contact ?'))return;contacts=contacts.filter(c=>c.id!==id);let d=set(DK);d.add(id);put(DK,d);let p=set(PK);p.delete(id);put(PK,p);save();$('contactDialog').close();render();del(id).catch(e=>console.warn('Suppression contact',e))};
 $('contactCategoryToggle').onclick=()=>{let b=$('contactCategoryBody'),v=b.style.display==='none';b.style.display=v?'block':'none';$('contactCategoryToggle').textContent=v?'Masquer':'Afficher'};
 $('addContactCategory').onclick=()=>{let n=$('newContactCategory').value.trim();if(n&&!cats.includes(n)){cats.push(n);subs[n]=[];$('newContactCategory').value='';save();render();markRefsPending();saveRefs()}};
 $('contactCategoryRows').onclick=e=>{
  if(e.target.dataset.cm!==undefined){let i=+e.target.dataset.cm,j=i+Number(e.target.dataset.dir);if(j>=0&&j<cats.length){[cats[i],cats[j]]=[cats[j],cats[i]];save();render();markRefsPending();saveRefs()}return}
  if(e.target.dataset.cr!==undefined){let i=+e.target.dataset.cr,n=document.querySelector(`[data-ci="${i}"]`).value.trim(),old=cats[i];if(n&&n!==old&&!cats.includes(n)){cats[i]=n;subs[n]=subs[old]||[];delete subs[old];contacts.forEach(c=>{if(c.category===old){c.category=n;c.updatedAt=new Date().toISOString();let p=set(PK);p.add(c.id);put(PK,p);up(c).catch(console.warn)}});save();render();markRefsPending();saveRefs()}return}
  if(e.target.dataset.cd!==undefined){let i=+e.target.dataset.cd,old=cats[i];if(contacts.some(c=>c.category===old)){alert('Cette catégorie est utilisée par un contact.');return}cats.splice(i,1);delete subs[old];save();render();markRefsPending();saveRefs();return}
  if(e.target.dataset.sa!==undefined){let i=+e.target.dataset.sa,cat=cats[i],inp=document.querySelector(`[data-new-sub="${i}"]`),n=inp.value.trim();if(n&&!(subs[cat]||[]).includes(n)){subs[cat].push(n);inp.value='';save();render();markRefsPending();saveRefs()}return}
  if(e.target.dataset.sm!==undefined){let i=+e.target.dataset.sm,j=+e.target.dataset.sj,cat=cats[i],k=j+Number(e.target.dataset.dir),a=subs[cat]||[];if(k>=0&&k<a.length){[a[j],a[k]]=[a[k],a[j]];save();render();markRefsPending();saveRefs()}return}
  if(e.target.dataset.sr!==undefined){let i=+e.target.dataset.sr,j=+e.target.dataset.sj,cat=cats[i],a=subs[cat]||[],old=a[j],n=document.querySelector(`[data-si="${i}"][data-sj="${j}"]`).value.trim();if(n&&n!==old&&!a.includes(n)){a[j]=n;contacts.forEach(c=>{if(c.category===cat&&c.subcategory===old){c.subcategory=n;c.updatedAt=new Date().toISOString();let p=set(PK);p.add(c.id);put(PK,p);up(c).catch(console.warn)}});save();render();markRefsPending();saveRefs()}return}
  if(e.target.dataset.sd!==undefined){let i=+e.target.dataset.sd,j=+e.target.dataset.sj,cat=cats[i],a=subs[cat]||[],old=a[j];if(contacts.some(c=>c.category===cat&&c.subcategory===old)){alert('Cette sous-catégorie est utilisée par un contact.');return}a.splice(j,1);save();render();markRefsPending();saveRefs()}
 };
 pull();setInterval(pull,20000);window.addEventListener('focus',pull);document.addEventListener('visibilitychange',()=>{if(!document.hidden)pull()});
});
window.portalAnnuaireCloudDelete=del;window.portalAnnuairePendingDeletes=()=>[...set(DK)];window.portalAnnuaireCloudSync=pull;window.portalRenderAnnuaire=render;
})();