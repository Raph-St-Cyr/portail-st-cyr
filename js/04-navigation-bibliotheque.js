(()=>{'use strict';const el=id=>document.getElementById(id);const photoKey='saintcyr.portal.photo',logoKey='saintcyr.portal.logo';function showModule(module){el('portalHome').hidden=module!=='home';el('portalPilotage').hidden=module!=='pilotage';el('portalLibrary').hidden=module!=='library';if(module==='library')renderDocs();window.scrollTo(0,0)}
function refreshImages(){for(const [id,key] of [['portalPhoto',photoKey],['portalLogo',logoKey]]){let src=null,img=el(id);try{src=localStorage.getItem(key)}catch(e){console.warn('Préférences images indisponibles',e)}img.hidden=false;if(src)img.src=src;else img.src=img.dataset.originalSrc||img.src}}for(const id of ['portalPhoto','portalLogo'])el(id).dataset.originalSrc=el(id).src;refreshImages();
function saveImage(input,key){let file=input.files?.[0];if(!file)return;if(!/^image\/(png|jpeg|webp)$/.test(file.type))return alert('Choisir une image PNG, JPEG ou WebP.');if(file.size>4*1024*1024)return alert('Image trop volumineuse : maximum 4 Mo.');let reader=new FileReader();reader.onload=()=>{try{localStorage.setItem(key,reader.result);refreshImages()}catch{alert('Espace de stockage insuffisant. Réduisez le poids de la photo.')}};reader.readAsDataURL(file)}
el('portalPhotoInput').onchange=e=>saveImage(e.target,photoKey);el('portalLogoInput').onchange=e=>saveImage(e.target,logoKey);el('portalCustomize').onclick=()=>el('portalConfig').showModal();el('portalResetImages').onclick=()=>{if(confirm('Rétablir les images officielles intégrées à cet accueil ?')){localStorage.removeItem(photoKey);localStorage.removeItem(logoKey);refreshImages()}};document.querySelectorAll('.portal-tile[data-module]').forEach(b=>b.addEventListener('click',()=>showModule(b.dataset.module)));window.portalRefreshLibrary=()=>renderDocs();
el('portalBack').onclick=el('libraryBack').onclick=()=>{
el('portalToday').textContent=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());showModule('home');};

const DBNAME='saintcyr.portal.documents',STORE='documents',THEMEKEY='saintcyr.portal.documentThemes.v1';
const defaultThemes=['Délibérations et arrêtés','Commissions et comptes rendus','Travaux et projets','Finances et devis','École et périscolaire','Communication','Urbanisme','Manifestations et cérémonies','Modèles et documents types','Autres documents'];
let conn;
function openDB(){if(conn)return Promise.resolve(conn);return new Promise((resolve,reject)=>{let req=indexedDB.open(DBNAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'})};req.onsuccess=()=>{conn=req.result;resolve(conn)};req.onerror=()=>reject(req.error)})}
function transact(mode,fn){return openDB().then(db=>new Promise((resolve,reject)=>{let tx=db.transaction(STORE,mode),req=fn(tx.objectStore(STORE));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)}))}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]))}
function themes(){try{let a=JSON.parse(localStorage.getItem(THEMEKEY));if(Array.isArray(a)&&a.length)return [...new Set(a)]}catch(e){}return [...defaultThemes]}
function storeThemes(a){localStorage.setItem(THEMEKEY,JSON.stringify(a))}
let currentThemes=themes();
const DOCVIEWKEY='saintcyr.portal.documentView.v1';let docView=localStorage.getItem(DOCVIEWKEY)==='list'?'list':'folders';
function updateThemeSelectors(){let previous=el('docCategory').value,filter=el('docFilter').value;el('docCategory').innerHTML=currentThemes.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');if(currentThemes.includes(previous))el('docCategory').value=previous;el('docFilter').innerHTML='<option value="">Toutes les thématiques</option>'+currentThemes.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');if(currentThemes.includes(filter))el('docFilter').value=filter}
function updateCommissions(){let sel=el('docCommission'),old=sel.value;sel.innerHTML='<option value="">Sans commission</option>'+db.commissions.map(x=>'<option>'+esc(x)+'</option>').join('');sel.value=old||'';let filter=el('docCommissionFilter'),filterOld=filter.value;filter.innerHTML='<option value="">Toutes les commissions</option><option value="__none__">Sans commission</option>'+db.commissions.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');filter.value=[...filter.options].some(o=>o.value===filterOld)?filterOld:''}
function kindToggle(){let file=el('docKind').value==='file';el('docFileWrap').hidden=!file;el('docLinkWrap').hidden=file;el('docFile').required=file;el('docUrl').required=!file}
el('docKind').onchange=kindToggle;kindToggle();updateThemeSelectors();updateCommissions();
function setDocFormMode(editing){el('docFormTitle').textContent=editing?'Modifier la ressource':'Ajouter une ressource';el('docSubmitButton').textContent=editing?'Enregistrer':'+ Ajouter la ressource'}
el('openDocAdd').onclick=()=>{el('docForm').reset();el('docEditId').value='';setDocFormMode(false);kindToggle();updateThemeSelectors();updateCommissions();el('docAddDialog').showModal()};el('closeDocAdd').onclick=el('cancelDocAdd').onclick=()=>el('docAddDialog').close();
function validLink(raw){try{let u=new URL(raw);return ['https:','http:'].includes(u.protocol)?u.href:null}catch(e){return null}}
async function localDocs(){return transact('readonly',store=>store.getAll())}
function cloudDocFromRow(r){return {id:r.id,kind:'link',title:r.title||'',category:r.theme||'Autres documents',commission:r.commission||'',description:r.description||'',url:r.url||'',created:r.created_at||new Date().toISOString(),cloud:true}}
async function cloudDocs(){
 const client=window.portalCloudClient;if(!client)return [];
 const {data:{session}}=await client.auth.getSession();if(!session)return [];
 const {data,error}=await client.from('portal_resources').select('*').order('title',{ascending:true});if(error)throw error;
 return (data||[]).map(cloudDocFromRow)
}
function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
async function migrateLocalLinks(local,cloud){
 const client=window.portalCloudClient;if(!client)return cloud;
 const {data:{session}}=await client.auth.getSession();if(!session)return cloud;
 const cloudById=new Map(cloud.map(d=>[d.id,d])),cloudByUrl=new Map(cloud.filter(d=>d.url).map(d=>[d.url,d]));
 for(const d of local.filter(x=>(x.kind==='link'||!!x.url)&&x.url)){
  if(cloudById.has(d.id)||cloudByUrl.has(d.url))continue;
  const row={title:d.title||'Ressource',theme:d.category||null,commission:d.commission||null,support:'link',url:d.url,description:d.description||null,updated_at:new Date().toISOString()};
  let data,error;
  if(isUuid(d.id))({data,error}=await client.from('portal_resources').upsert({...row,id:d.id},{onConflict:'id'}).select().single());
  else ({data,error}=await client.from('portal_resources').insert(row).select().single());
  if(error){console.warn('Migration ressource locale impossible',d.title,error);continue}
  const migrated=cloudDocFromRow(data);cloud.push(migrated);cloudById.set(migrated.id,migrated);cloudByUrl.set(migrated.url,migrated);
  if(d.id!==migrated.id){await transact('readwrite',store=>store.delete(d.id));d.id=migrated.id;await transact('readwrite',store=>store.put(d))}
  d.cloud=true;
 }
 return cloud
}
async function allDocs(){
 const local=await localDocs();let cloud=[];try{cloud=await cloudDocs();cloud=await migrateLocalLinks(local,cloud)}catch(e){console.warn('Bibliothèque Supabase indisponible',e)}
 const merged=new Map(local.map(d=>[d.id,d]));cloud.forEach(d=>merged.set(d.id,d));return [...merged.values()]
}
async function cloudSaveDoc(d){
 if(d.kind!=='link'||!d.url)return;
 const client=window.portalCloudClient;if(!client)return;
 const {data:{session}}=await client.auth.getSession();if(!session)return;
 const row={id:d.id,title:d.title,theme:d.category||null,commission:d.commission||null,support:'link',url:d.url,description:d.description||null,updated_at:new Date().toISOString()};
 const {error}=await client.from('portal_resources').upsert(row,{onConflict:'id'});if(error)throw error;d.cloud=true
}
async function cloudDeleteDoc(d){
 if(!d?.cloud)return;const client=window.portalCloudClient;if(!client)return;
 const {data:{session}}=await client.auth.getSession();if(!session)return;
 const {error}=await client.from('portal_resources').delete().eq('id',d.id);if(error)throw error
}
async function renderDocs(){try{
 const all=await allDocs();const q=el('docSearch').value.trim().toLocaleLowerCase('fr'),cat=el('docFilter').value,commission=el('docCommissionFilter').value,kind=el('docKindFilter').value;
 el('docTotal').textContent=all.length;el('docLinksCount').textContent=all.filter(d=>d.kind==='link'||!!d.url).length;el('docFilesCount').textContent=all.filter(d=>d.kind!=='link'&&!d.url).length;
 let docs=all.filter(d=>(!cat||d.category===cat)&&(!commission||(commission==='__none__'?!d.commission:d.commission===commission))&&(!kind||(kind==='link'?(d.kind==='link'||!!d.url):(!d.url&&d.kind!=='link')))&&(!q||[d.title,d.description,d.category,d.commission,d.fileName,d.url].join(' ').toLocaleLowerCase('fr').includes(q))).sort((a,b)=>(a.title||'').localeCompare((b.title||''),'fr',{sensitivity:'base'}));
 el('docCount').textContent=docs.length+' ressource(s)';
 el('docThemeChips').innerHTML='<button type="button" class="theme-chip '+(!cat?'selected':'')+'" data-theme="">Toutes</button>'+currentThemes.map(t=>`<button type="button" class="theme-chip ${cat===t?'selected':''}" data-theme="${esc(t)}">${esc(t)} <span>${all.filter(d=>d.category===t).length}</span></button>`).join('');
 const actionButtons=d=>{let link=d.kind==='link'||!!d.url;return `${link?`<button type="button" data-doc-open="${esc(d.id)}">Ouvrir ↗</button>`:`<button type="button" data-doc-download="${esc(d.id)}">Télécharger ↓</button>`}<button type="button" class="secondary" data-doc-edit="${esc(d.id)}">Modifier</button><button type="button" class="secondary" data-doc-delete="${esc(d.id)}">Supprimer</button>`};
 el('docViewFolders').classList.toggle('active',docView==='folders');el('docViewList').classList.toggle('active',docView==='list');
 if(!docs.length){el('docResults').className=docView==='folders'?'resource-groups':'';el('docResults').innerHTML='<p class="muted">Aucune ressource pour cette sélection.</p>'}
 else if(docView==='list'){el('docResults').className='';el('docResults').innerHTML=docs.map(d=>{let link=d.kind==='link'||!!d.url;return `<div class="resource-list-row"><strong>${esc(d.title)}</strong><span>${esc(d.category||'Sans thématique')}</span><small>${esc(d.commission||'Sans commission')} · ${link?'Lien':'Fichier'}</small><div class="resource-actions">${actionButtons(d)}</div></div>`}).join('')}
 else{el('docResults').className='resource-groups';let groups=[...new Set(docs.map(d=>d.category||'Sans thématique'))].sort((a,b)=>a.localeCompare(b,'fr'));el('docResults').innerHTML=groups.map(g=>{let items=docs.filter(d=>(d.category||'Sans thématique')===g);return `<details class="resource-group" open><summary><span>${esc(g)}</span><span class="pill">${items.length}</span></summary><div class="resource-group-body">${items.map(d=>{let link=d.kind==='link'||!!d.url;return `<div class="resource-list-row"><strong>${esc(d.title)}</strong><small>${esc(d.commission||'Sans commission')}</small><small>${link?'Lien':'Fichier'} · ${new Date(d.created||Date.now()).toLocaleDateString('fr-FR')}</small><div class="resource-actions">${actionButtons(d)}</div></div>`}).join('')}</div></details>`}).join('')}
 }catch(e){el('docResults').textContent='Bibliothèque indisponible : '+e.message}}
el('docForm').onsubmit=async e=>{e.preventDefault();let editId=el('docEditId').value,file=el('docFile').files[0],link=el('docKind').value==='link',url=link?validLink(el('docUrl').value):null;if(link&&!url)return alert('Saisissez un lien HTTP ou HTTPS valide.');let existing=editId?(await allDocs()).find(x=>x.id===editId):null;if(!link&&!file&&!existing?.file)return alert('Sélectionnez un fichier.');if(file&&!link&&file.size>20*1024*1024)return alert('Maximum 20 Mo par fichier.');
let d={...(existing||{}),id:editId||crypto.randomUUID(),kind:link?'link':'file',title:el('docTitle').value.trim(),category:el('docCategory').value,commission:el('docCommission').value,description:el('docDescription').value.trim(),created:existing?.created||new Date().toISOString()};if(link){d.url=url;delete d.file;delete d.fileName}else if(file){d.file=file;d.fileName=file.name;delete d.url}
try{await transact('readwrite',store=>store.put(d));if(link)await cloudSaveDoc(d);el('docForm').reset();el('docEditId').value='';setDocFormMode(false);kindToggle();el('docAddDialog').close();renderDocs()}catch(err){alert('Enregistrement impossible : '+err.message)}};
el('docResults').onclick=async e=>{let button=e.target.closest('[data-doc-open],[data-doc-download],[data-doc-edit],[data-doc-delete]');if(!button)return;let id=button.dataset.docOpen||button.dataset.docDownload||button.dataset.docEdit||button.dataset.docDelete;let d=(await allDocs()).find(x=>x.id===id);if(!d)return;
if(button.hasAttribute('data-doc-open')){let url=validLink(d.url);if(url)window.open(url,'_blank','noopener,noreferrer');else alert('Lien non valide.')}
if(button.hasAttribute('data-doc-download')){if(!d.file)return alert('Fichier introuvable.');let url=URL.createObjectURL(d.file),a=document.createElement('a');a.href=url;a.download=d.fileName||d.title;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
if(button.hasAttribute('data-doc-edit')){el('docForm').reset();updateThemeSelectors();updateCommissions();el('docEditId').value=d.id;el('docTitle').value=d.title||'';el('docCategory').value=currentThemes.includes(d.category)?d.category:currentThemes[0];el('docCommission').value=d.commission||'';el('docKind').value=(d.kind==='link'||!!d.url)?'link':'file';el('docUrl').value=d.url||'';el('docDescription').value=d.description||'';setDocFormMode(true);kindToggle();el('docAddDialog').showModal()}
if(button.hasAttribute('data-doc-delete')&&confirm('Supprimer cette ressource de la bibliothèque ?')){await cloudDeleteDoc(d);await transact('readwrite',store=>store.delete(id));renderDocs()}};
el('docViewFolders').onclick=()=>{docView='folders';localStorage.setItem(DOCVIEWKEY,docView);renderDocs()};el('docViewList').onclick=()=>{docView='list';localStorage.setItem(DOCVIEWKEY,docView);renderDocs()};
el('docSearch').oninput=el('docFilter').onchange=el('docCommissionFilter').onchange=el('docKindFilter').onchange=renderDocs;
el('docThemeChips').onclick=e=>{let b=e.target.closest('[data-theme]');if(b){el('docFilter').value=b.dataset.theme;renderDocs()}};
function themeRows(){el('themeRows').innerHTML=currentThemes.map((t,i)=>`<div class="theme-row"><span>${esc(t)}</span><div><button type="button" class="secondary" data-rename-theme="${i}">Renommer</button><button type="button" class="secondary" data-delete-theme="${i}">Supprimer</button></div></div>`).join('')}
el('manageThemes').onclick=()=>{themeRows();el('themeDialog').showModal()};
el('closeThemes').onclick=el('themeDone').onclick=()=>el('themeDialog').close();
el('themeForm').onsubmit=e=>{e.preventDefault();let t=el('newThemeName').value.trim();if(!t)return;if(currentThemes.some(x=>x.toLowerCase()===t.toLowerCase()))return alert('Cette thématique existe déjà.');currentThemes.push(t);storeThemes(currentThemes);el('newThemeName').value='';themeRows();updateThemeSelectors();renderDocs()};
el('themeRows').onclick=async e=>{let rename=e.target.closest('[data-rename-theme]'),del=e.target.closest('[data-delete-theme]');if(!rename&&!del)return;let i=Number((rename||del).dataset.renameTheme??del?.dataset.deleteTheme),old=currentThemes[i];if(!old)return;let docs=await allDocs();if(rename){let n=prompt('Nouveau nom de la thématique :',old);if(n===null)return;n=n.trim();if(!n||currentThemes.some((t,j)=>j!==i&&t.toLowerCase()===n.toLowerCase()))return alert('Nom vide ou déjà utilisé.');for(let d of docs.filter(d=>d.category===old)){d.category=n;await transact('readwrite',store=>store.put(d));if(d.url)await cloudSaveDoc(d)}currentThemes[i]=n}else{if(docs.some(d=>d.category===old))return alert('Cette thématique contient des ressources. Déplacez-les ou renommez le thème avant de le supprimer.');if(!confirm('Supprimer la thématique « '+old+' » ?'))return;currentThemes.splice(i,1);if(!currentThemes.length)currentThemes=['Autres documents']}
storeThemes(currentThemes);themeRows();updateThemeSelectors();renderDocs()};
el('portalToday').textContent=new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());showModule('home');
})();

// V6.2.24 — accès contrôlé aux thématiques pour les paramètres synchronisés.
window.portalGetThemes=()=>[...currentThemes];
window.portalApplyThemes=(values)=>{const clean=[...new Set((values||[]).map(x=>String(x).trim()).filter(Boolean))];if(!clean.length)return;currentThemes=clean;storeThemes(currentThemes);themeRows();updateThemeSelectors();renderDocs();};
