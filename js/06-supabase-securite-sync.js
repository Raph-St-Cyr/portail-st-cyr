// ===== V5.6 — Synchronisation Supabase via client officiel =====
const SUPABASE_URL='https://zjqeasltefdmuffbmgbo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_tIfKzUoWZftPkuosQ03FtA_1d0DEw_J';
const cloudClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
window.portalCloudClient=cloudClient; // client partagé avec la bibliothèque

function cloudSetState(text,ok=false){
 const el=$('cloudState'); if(!el)return;
 el.textContent=text; el.className='pill '+(ok?'cloud-ok':'cloud-warn');
}
function cloudMessage(text){if($('cloudDetails'))$('cloudDetails').textContent=text}
function cloudSoftError(err){console.error('[Supabase]',err);cloudSetState('Erreur',false);cloudMessage('Supabase : '+(err?.message||err))}
function uuidOk(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||''))}
function ensureCloudIds(t){
 if(!uuidOk(t.id))t.id=crypto.randomUUID();
 (t.subtasks||[]).forEach(st=>{if(!uuidOk(st.id))st.id=crypto.randomUUID()});
}
async function cloudLogin(){
 const email=$('cloudEmail').value.trim(),password=$('cloudPassword').value;
 if(!email||!password)throw new Error('Indiquez votre e-mail et votre mot de passe.');
 const {data,error}=await cloudClient.auth.signInWithPassword({email,password});
 if(error)throw error;
 $('cloudPassword').value='';
 cloudSetState('Connecté',true);
 cloudMessage('Connexion Supabase réussie : '+(data.user?.email||email));
 return data;
}
async function cloudLogout(){
 const {error}=await cloudClient.auth.signOut(); if(error)throw error;
 cloudSetState('Déconnecté',false);cloudMessage('Session Supabase supprimée de ce navigateur.');
}
function actionCloudRow(t){
 return {id:t.id,title:t.title||'',description:t.description||null,commission:t.commission||null,reference:t.reference||null,
 priority:t.priority||'P3',status:t.status||'À faire',pilot:t.pilot||null,assignee:t.assignee||null,
 created:t.created||null,due:t.due||null,reminder:t.reminder||null,decision:!!t.decision,link:t.link||null,
 dossier_id:uuidOk(t.dossierId)?t.dossierId:null,updated_at:new Date().toISOString()};
}
async function cloudRequireUser(){
 const {data,error}=await cloudClient.auth.getUser(); if(error||!data.user)throw error||new Error('Connectez-vous d’abord à Supabase.');
 return data.user;
}

const CLOUD_PENDING_KEY='saintcyr.cloud.pending.v1';
const CLOUD_DELETES_KEY='saintcyr.cloud.deletes.v1';
const cloudPending=()=>new Set(JSON.parse(localStorage.getItem(CLOUD_PENDING_KEY)||'[]'));
const cloudDeletes=()=>new Set(JSON.parse(localStorage.getItem(CLOUD_DELETES_KEY)||'[]'));
function cloudStoreSet(key,set){localStorage.setItem(key,JSON.stringify([...set]))}
function cloudMarkPending(id){const s=cloudPending();s.add(id);cloudStoreSet(CLOUD_PENDING_KEY,s)}
function cloudClearPending(id){const s=cloudPending();s.delete(id);cloudStoreSet(CLOUD_PENDING_KEY,s)}
function cloudMarkDelete(id){const s=cloudDeletes();s.add(id);cloudStoreSet(CLOUD_DELETES_KEY,s)}
function cloudClearDelete(id){const s=cloudDeletes();s.delete(id);cloudStoreSet(CLOUD_DELETES_KEY,s)}

async function cloudUpsertAction(t){
 const {data:{session}}=await cloudClient.auth.getSession(); if(!session)return;
 ensureCloudIds(t);save();
 let {error}=await cloudClient.from('actions').upsert(actionCloudRow(t),{onConflict:'id'});
 if(error)throw error;
 ({error}=await cloudClient.from('action_subtasks').delete().eq('action_id',t.id)); if(error)throw error;
 const rows=(t.subtasks||[]).map(st=>({id:st.id,action_id:t.id,title:st.title||'',owner:st.owner||null,due:st.due||null,done:!!st.done}));
 if(rows.length){({error}=await cloudClient.from('action_subtasks').insert(rows));if(error)throw error;}
 cloudClearPending(t.id);
 cloudSetState('Synchronisé',true);cloudMessage('Dernière synchronisation : '+new Date().toLocaleString('fr-FR'));
}
async function cloudDeleteAction(id){
 const {data:{session}}=await cloudClient.auth.getSession(); if(!session||!uuidOk(id))return;
 const {error}=await cloudClient.from('actions').delete().eq('id',id);if(error)throw error;
 cloudClearDelete(id);
 cloudSetState('Synchronisé',true);cloudMessage('Suppression répercutée dans Supabase.');
}
async function cloudPushAll(){
 await cloudRequireUser();
 for(const t of db.tasks)await cloudUpsertAction(t);
 save();render();cloudSetState('Synchronisé',true);cloudMessage(db.tasks.length+' action(s) locale(s) envoyée(s) vers Supabase.');
}
async function cloudPull(silent=false){
 await cloudRequireUser();
 let {data:actions,error}=await cloudClient.from('actions').select('*').order('created_at',{ascending:true});if(error)throw error;
 let {data:subs,error:subError}=await cloudClient.from('action_subtasks').select('*');if(subError)throw subError;
 const byAction={};(subs||[]).forEach(st=>(byAction[st.action_id]??=[]).push({id:st.id,title:st.title,owner:st.owner||'',due:st.due||'',done:!!st.done}));
 const pending=cloudPending(), deletes=cloudDeletes(), localById=new Map(db.tasks.map(t=>[t.id,t]));
 const cloudIds=new Set((actions||[]).map(a=>a.id));
 const next=[];
 (actions||[]).forEach(a=>{
  if(deletes.has(a.id))return;
  if(pending.has(a.id)&&localById.has(a.id)){next.push(localById.get(a.id));return;}
  const prior=localById.get(a.id)||{history:[]};
  next.push({...prior,id:a.id,title:a.title||'',description:a.description||'',commission:a.commission||'',reference:a.reference||'',priority:a.priority||'P3',status:a.status||'',pilot:a.pilot||'',assignee:a.assignee||'',created:a.created||'',due:a.due||'',reminder:a.reminder||'',decision:!!a.decision,link:a.link||'',dossierId:a.dossier_id||'',subtasks:byAction[a.id]||[]});
 });
 // Conserver les modifications locales non encore envoyées si Internet a coupé.
 db.tasks.forEach(t=>{if(pending.has(t.id)&&!cloudIds.has(t.id)&&!deletes.has(t.id))next.push(t)});
 db.tasks=next;
 save();refreshSelects();render();cloudSetState('Synchronisé',true);
 if(!silent)cloudMessage((actions||[]).length+' action(s) synchronisée(s) depuis Supabase.');
}

// ===== V6.2.20 — Paramètres communs : récupération fiable sans interrompre la saisie =====
const PORTAL_SETTINGS_ID='municipal_config';
function cloudSettingsPayload(){
 return {
  commissions:Array.isArray(db?.commissions)?[...db.commissions]:[],
  settings:db?.settings?JSON.parse(JSON.stringify(db.settings)):{},
  documentThemes:typeof window.portalGetLibraryThemes==='function'?window.portalGetLibraryThemes():[]
 };
}
function cloudApplySettingsPayload(payload){
 if(!payload||typeof payload!=='object')return;
 let changed=false;
 if(Array.isArray(payload.commissions)&&payload.commissions.length){db.commissions=[...new Set(payload.commissions.map(String))];changed=true}
 if(payload.settings&&typeof payload.settings==='object'){db.settings={...db.settings,...payload.settings};changed=true}
 if(changed){save();refreshSelects();refreshConfig();render()}
 if(Array.isArray(payload.documentThemes)&&payload.documentThemes.length&&typeof window.portalApplyLibraryThemes==='function')window.portalApplyLibraryThemes(payload.documentThemes);
}
async function cloudPushSettings(){
 const {data:{session}}=await cloudClient.auth.getSession();if(!session)return;
 const row={id:PORTAL_SETTINGS_ID,payload:cloudSettingsPayload(),updated_at:new Date().toISOString()};
 const {error}=await cloudClient.from('portal_settings').upsert(row,{onConflict:'id'});if(error)throw error;
}
async function cloudSyncSettings(){
 const {data:{session}}=await cloudClient.auth.getSession();if(!session)return;
 const {data,error}=await cloudClient.from('portal_settings').select('payload,updated_at').eq('id',PORTAL_SETTINGS_ID).maybeSingle();if(error)throw error;
 if(!data){await cloudPushSettings();return 'seeded'}
 cloudApplySettingsPayload(data.payload);return 'pulled';
}
window.portalPushSettings=cloudPushSettings;
function cloudSettingsEditing(){
 const a=document.activeElement;
 const editIds=new Set(['commissionEdit','cfgElus','cfgAgents','cfgTypes','cfgDStatuses','cfgPriorityLabels','cfgCommune','newThemeName']);
 if(a&&editIds.has(a.id))return true;
 const themeDialog=document.getElementById('themeManager');
 return !!(themeDialog&&themeDialog.open&&themeDialog.contains(a));
}
async function cloudPullSettingsSafely(){
 if(cloudSettingsEditing())return 'editing';
 return cloudSyncSettings();
}
// ===== fin V6.2.20 =====

let cloudAutoBusy=false;
async function cloudAutoSync(){
 if(cloudAutoBusy||document.body.classList.contains('auth-locked'))return;
 cloudAutoBusy=true;
 try{
  // Réessayer d'abord les changements locaux restés en attente.
  const deletes=cloudDeletes();
  for(const id of [...deletes])await cloudDeleteAction(id);
  const pending=cloudPending();
  for(const id of [...pending]){const t=db.tasks.find(x=>x.id===id);if(t)await cloudUpsertAction(t)}
  await cloudPull(true);
  // Bibliothèque : utiliser la même synchronisation automatique que les Actions.
  // Cela garantit la récupération des ressources Supabase même si postgres_changes ne livre aucun événement.
  if(typeof window.portalRefreshLibrary==='function') await window.portalRefreshLibrary();
  // V6.2.27 : aucun pull automatique des paramètres.
  // Actions, dossiers et bibliothèque conservent leur synchronisation automatique.
  cloudSetState('Synchronisé',true);
  cloudMessage('Synchronisation automatique : '+new Date().toLocaleTimeString('fr-FR'));
 }catch(err){cloudSoftError(err)}
 finally{cloudAutoBusy=false}
}

$('cloudLogin').onclick=()=>cloudLogin().catch(cloudSoftError);
$('cloudLogout').onclick=()=>cloudLogout().catch(cloudSoftError);
$('cloudPushAll').onclick=()=>{if(confirm('Envoyer toutes les actions locales vers Supabase ?'))cloudPushAll().catch(cloudSoftError)};
$('cloudPull').onclick=()=>cloudPull().catch(cloudSoftError);
cloudClient.auth.getSession().then(({data})=>{
 if(data.session){cloudSetState('Session mémorisée',true);cloudMessage('Session Supabase présente sur ce navigateur.')}else cloudSetState('Déconnecté',false);
}).catch(cloudSoftError);
// ===== fin V5.6 =====
// ===== V5.9 — Verrouillage du portail par Supabase Auth =====
const authGate=document.getElementById('authGate');
const authEmail=document.getElementById('authEmail');
const authPassword=document.getElementById('authPassword');
const authLoginBtn=document.getElementById('authLoginBtn');
const authGateStatus=document.getElementById('authGateStatus');

function setPortalAccess(session){
 const allowed=!!session?.user;
 document.body.classList.toggle('auth-locked',!allowed);
 authGate.hidden=allowed;
 if(allowed){
   authGateStatus.textContent='';
   if(document.getElementById('cloudEmail') && session.user.email) document.getElementById('cloudEmail').value=session.user.email;
 }else{
   authPassword.value='';
   authGateStatus.className='auth-status';
   authGateStatus.textContent='Connectez-vous pour accéder au portail.';
 }
}
async function authGateLogin(){
 const email=authEmail.value.trim(), password=authPassword.value;
 if(!email||!password){authGateStatus.className='auth-status error';authGateStatus.textContent='Indiquez votre e-mail et votre mot de passe.';return}
 authLoginBtn.disabled=true;authGateStatus.className='auth-status';authGateStatus.textContent='Connexion…';
 const {data,error}=await cloudClient.auth.signInWithPassword({email,password});
 authLoginBtn.disabled=false;
 if(error){authGateStatus.className='auth-status error';authGateStatus.textContent='Connexion impossible : '+error.message;return}
 setPortalAccess(data.session);
 cloudSetState('Connecté',true);
 cloudMessage('Connexion Supabase réussie : '+(data.user?.email||email));
 setTimeout(()=>cloudAutoSync(),0);
}
authLoginBtn.addEventListener('click',()=>authGateLogin().catch(err=>{authLoginBtn.disabled=false;authGateStatus.className='auth-status error';authGateStatus.textContent='Connexion impossible : '+(err?.message||err)}));
authPassword.addEventListener('keydown',e=>{if(e.key==='Enter')authLoginBtn.click()});
cloudClient.auth.getSession().then(({data})=>{setPortalAccess(data.session);if(data.session)setTimeout(async()=>{try{await cloudPullSettingsSafely()}catch(err){cloudSoftError(err)}cloudAutoSync()},0)}).catch(err=>{authGateStatus.className='auth-status error';authGateStatus.textContent='Vérification impossible : '+(err?.message||err)});
cloudClient.auth.onAuthStateChange((_event,session)=>{setPortalAccess(session);if(session)setTimeout(()=>cloudAutoSync(),0)});
window.addEventListener('focus',()=>cloudAutoSync());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)cloudAutoSync()});
setInterval(()=>cloudAutoSync(),10000);

// ===== V6.1 — Supabase Realtime : mise à jour sans recharger la page =====
let cloudRealtimeChannel=null;
let cloudLibraryRealtimeChannel=null;
let cloudRealtimeTimer=null;
let cloudLibraryRealtimeTimer=null;
function cloudRealtimeRefresh(){
 clearTimeout(cloudRealtimeTimer);
 cloudRealtimeTimer=setTimeout(()=>cloudAutoSync(),250);
}
function cloudLibraryRealtimeRefresh(payload){
 const eventDiag=document.getElementById('libraryRealtimeEvent');
 if(eventDiag){
  const eventType=payload?.eventType||payload?.event||'ÉVÉNEMENT';
  eventDiag.textContent=eventType+' — '+new Date().toLocaleTimeString('fr-FR');
  eventDiag.classList.add('ok');
 }
 console.info('[Supabase Realtime Bibliothèque événement]',payload);
 clearTimeout(cloudLibraryRealtimeTimer);
 cloudLibraryRealtimeTimer=setTimeout(()=>{if(typeof window.portalRefreshLibrary==='function')window.portalRefreshLibrary()},250);
}
function cloudStartRealtime(){
 if(!cloudRealtimeChannel){
  cloudRealtimeChannel=cloudClient.channel('portail-actions-live')
   .on('postgres_changes',{event:'*',schema:'public',table:'actions'},cloudRealtimeRefresh)
   .on('postgres_changes',{event:'*',schema:'public',table:'action_subtasks'},cloudRealtimeRefresh)
   .subscribe();
 }
 if(!cloudLibraryRealtimeChannel){
  cloudLibraryRealtimeChannel=cloudClient.channel('portail-library-live')
   .on('postgres_changes',{event:'*',schema:'public',table:'portal_resources'},cloudLibraryRealtimeRefresh)
   .subscribe(status=>{
    const diag=document.getElementById('libraryRealtimeState');
    if(diag){diag.textContent=status;diag.classList.toggle('ok',status==='SUBSCRIBED')}
    console.info('[Supabase Realtime Bibliothèque]',status);
   });
 }
}
async function cloudStopRealtime(){
 const channels=[cloudRealtimeChannel,cloudLibraryRealtimeChannel].filter(Boolean);
 cloudRealtimeChannel=null;cloudLibraryRealtimeChannel=null;
 for(const ch of channels){try{await cloudClient.removeChannel(ch)}catch(e){console.warn('[Supabase Realtime]',e)}}
}
cloudClient.auth.onAuthStateChange((_event,session)=>{if(session)cloudStartRealtime();else cloudStopRealtime()});
cloudClient.auth.getSession().then(({data})=>{if(data.session)cloudStartRealtime()});
// ===== fin V6.1 =====

// Le bouton de déconnexion existant verrouille immédiatement le portail.
document.getElementById('cloudLogout').addEventListener('click',()=>setTimeout(async()=>{const {data}=await cloudClient.auth.getSession();setPortalAccess(data.session)},0));
// ===== fin V5.9 =====


(function verifyUniqueIds(){const seen=new Set(),dupes=new Set();document.querySelectorAll('[id]').forEach(n=>seen.has(n.id)?dupes.add(n.id):seen.add(n.id));if(dupes.size)console.error('[Portail municipal] IDs HTML dupliqués :',[...dupes]);})();
