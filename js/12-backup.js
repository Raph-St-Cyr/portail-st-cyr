(()=>{
'use strict';
const TABLES=[
 'action_subtasks','actions','dossiers','portal_meetings','portal_resources',
 'annuaire_contacts','portal_settings','portal_agenda_calendars','portal_agenda_events',
 'portal_room_calendars','portal_room_events'
];
const $=id=>document.getElementById(id);
const client=()=>window.portalCloudClient||null;
const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
const setStatus=s=>{const e=$('portalBackupStatus');if(e)e.textContent=s};
function download(name,obj){
 const u=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
async function sessionClient(){
 const cl=client();if(!cl)throw Error('Connexion Supabase indisponible.');
 const {data:{session}}=await cl.auth.getSession();if(!session)throw Error('Session Supabase absente.');
 return cl;
}
async function exportAll(){
 const cl=await sessionClient(),data={};
 for(const table of TABLES){
  const {data:rows,error}=await cl.from(table).select('*');
  if(error)throw Error(`${table} : ${error.message}`);
  data[table]=rows||[];
 }
 return {format:'portail-st-cyr-backup',format_version:1,portal_version:'V6.8.1',
   exported_at:new Date().toISOString(),tables:data};
}
function validate(obj){
 if(!obj||obj.format!=='portail-st-cyr-backup'||obj.format_version!==1||!obj.tables)throw Error('Format de sauvegarde non reconnu.');
 for(const table of TABLES)if(!Array.isArray(obj.tables[table]))throw Error(`Table absente ou invalide : ${table}`);
 return obj;
}
function preview(obj){
 const box=$('portalRestorePreview');if(!box)return;
 const total=TABLES.reduce((n,t)=>n+obj.tables[t].length,0);
 box.hidden=false;
 box.innerHTML=`<h3>Restauration prête</h3>
 <p><strong>Sauvegarde :</strong> ${new Date(obj.exported_at).toLocaleString('fr-FR')}<br>
 <strong>Version :</strong> ${obj.portal_version||'non indiquée'}<br>
 <strong>Enregistrements :</strong> ${total}</p>
 <p class="hint">La restauration remplace les données des modules sauvegardés. Les comptes et droits utilisateurs ne sont pas modifiés.</p>
 <button type="button" class="danger" id="portalRestoreConfirm">Restaurer cette sauvegarde</button>`;
 $('portalRestoreConfirm').onclick=()=>restoreAll(obj);
}
async function restoreAll(obj){
 if(!confirm("CONFIRMATION\n\nRemplacer les données actuelles du portail par cette sauvegarde ?\n\nCette opération ne peut pas être annulée sans une autre sauvegarde."))return;
 const cl=await sessionClient();
 setStatus('Restauration en cours…');
 // Child/dependent tables first on delete; parent/config tables then.
 const deleteOrder=['action_subtasks','portal_agenda_events','portal_room_events','actions','dossiers','portal_meetings','portal_resources','annuaire_contacts','portal_agenda_calendars','portal_room_calendars','portal_settings'];
 const insertOrder=['portal_settings','dossiers','actions','action_subtasks','portal_meetings','portal_resources','annuaire_contacts','portal_agenda_calendars','portal_agenda_events','portal_room_calendars','portal_room_events'];
 for(const table of deleteOrder){
  const rows=obj.tables[table];
  const {data:current,error:readError}=await cl.from(table).select('id');
  if(readError)throw Error(`${table} : ${readError.message}`);
  const ids=(current||[]).map(r=>r.id).filter(Boolean);
  if(ids.length){const {error}=await cl.from(table).delete().in('id',ids);if(error)throw Error(`${table} : ${error.message}`)}
 }
 for(const table of insertOrder){
  const rows=obj.tables[table];
  if(rows.length){const {error}=await cl.from(table).insert(rows);if(error)throw Error(`${table} : ${error.message}`)}
 }
 setStatus('Restauration terminée. Actualisez le portail sur vos appareils.');
 alert('Restauration terminée.');
}
document.addEventListener('DOMContentLoaded',()=>{
 const b=$('backup'),r=$('restore');if(!b||!r)return;
 b.onclick=async()=>{
  b.disabled=true;setStatus('Création de la sauvegarde complète…');
  try{const obj=await exportAll();download(`sauvegarde_portail_${stamp()}.json`,obj);setStatus(`Sauvegarde créée le ${new Date().toLocaleString('fr-FR')}.`)}
  catch(e){console.error('[Sauvegarde]',e);setStatus('Échec : '+e.message);alert('Sauvegarde impossible : '+e.message)}
  finally{b.disabled=false}
 };
 r.onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{preview(validate(JSON.parse(await f.text())));setStatus('Sauvegarde contrôlée. Vérifiez le résumé avant de restaurer.')}
  catch(err){setStatus('Fichier invalide : '+err.message);alert('Import impossible : '+err.message)}
  finally{e.target.value=''}
 };
});
})();