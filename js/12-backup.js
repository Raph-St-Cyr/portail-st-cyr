(()=>{
'use strict';
const TABLES=['action_subtasks','actions','dossiers','portal_meetings','portal_resources','annuaire_contacts','portal_settings','portal_agenda_calendars','portal_agenda_events','portal_room_calendars','portal_room_events'];
const $=id=>document.getElementById(id);
function dl(name,obj){const u=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function run(){
 const b=$('fullCloudBackup'),s=$('fullCloudBackupStatus');if(!b)return;b.disabled=true;if(s)s.textContent='Création de la sauvegarde complète…';
 try{
  const cl=window.portalCloudClient;if(!cl)throw Error('Connexion Supabase indisponible.');
  const {data:{session}}=await cl.auth.getSession();if(!session)throw Error('Session Supabase absente.');
  const tables={};for(const table of TABLES){const {data,error}=await cl.from(table).select('*');if(error)throw Error(table+' : '+error.message);tables[table]=data||[]}
  const now=new Date(),pad=n=>String(n).padStart(2,'0');
  dl(`sauvegarde_portail_${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}.json`,
     {format:'portail-st-cyr-backup',format_version:1,portal_version:'V6.8.1.4',exported_at:now.toISOString(),tables});
  if(s)s.textContent='Sauvegarde complète téléchargée.';
 }catch(e){console.error('[Sauvegarde complète]',e);if(s)s.textContent='Échec : '+e.message;alert('Sauvegarde impossible : '+e.message)}
 finally{b.disabled=false}
}

function validateBackup(obj){
 if(!obj||obj.format!=='portail-st-cyr-backup'||obj.format_version!==1||!obj.tables)throw Error('Format de sauvegarde non reconnu.');
 for(const table of TABLES)if(!Array.isArray(obj.tables[table]))throw Error('Table absente ou invalide : '+table);
 return obj;
}
function showPreview(obj){
 const box=$('fullCloudRestorePreview');if(!box)return;
 const total=TABLES.reduce((n,t)=>n+obj.tables[t].length,0);
 const date=obj.exported_at?new Date(obj.exported_at).toLocaleString('fr-FR'):'non indiquée';
 box.hidden=false;
 box.innerHTML='<h3>Contrôle de la sauvegarde</h3><p><strong>Date :</strong> '+date+
  '<br><strong>Version :</strong> '+String(obj.portal_version||'non indiquée')+
  '<br><strong>Enregistrements :</strong> '+total+
  '</p><p class="hint">Aucune donnée n’a encore été modifiée.</p>'+
  '<button type="button" class="danger" id="fullCloudRestoreConfirm">Restaurer cette sauvegarde</button>';
 const c=$('fullCloudRestoreConfirm');if(c)c.onclick=()=>restoreBackup(obj);
}
async function restoreBackup(obj){
 if(!confirm('ATTENTION\\n\\nCette opération va remplacer les données actuelles des modules par celles de la sauvegarde sélectionnée.\\n\\nLes comptes utilisateurs et leurs droits ne seront pas modifiés.\\n\\nContinuer ?'))return;
 const phrase=prompt('Pour confirmer la restauration, saisissez exactement : RESTAURER');
 if(phrase!=='RESTAURER'){alert('Restauration annulée.');return}
 const cl=window.portalCloudClient;if(!cl)throw Error('Connexion Supabase indisponible.');
 const {data:{session}}=await cl.auth.getSession();if(!session)throw Error('Session Supabase absente.');
 const s=$('fullCloudRestoreStatus');if(s)s.textContent='Restauration en cours…';
 // Suppression dans l'ordre des dépendances, puis réinsertion dans l'ordre inverse.
 const del=['action_subtasks','portal_agenda_events','portal_room_events','actions','dossiers','portal_meetings','portal_resources','annuaire_contacts','portal_agenda_calendars','portal_room_calendars','portal_settings'];
 const ins=['portal_settings','dossiers','actions','action_subtasks','portal_meetings','portal_resources','annuaire_contacts','portal_agenda_calendars','portal_agenda_events','portal_room_calendars','portal_room_events'];
 try{
  for(const table of del){
   const {data:rows,error:rerr}=await cl.from(table).select('id');if(rerr)throw Error(table+' : '+rerr.message);
   const ids=(rows||[]).map(x=>x.id).filter(Boolean);
   if(ids.length){const {error}=await cl.from(table).delete().in('id',ids);if(error)throw Error(table+' : '+error.message)}
  }
  for(const table of ins){
   const rows=obj.tables[table];
   if(rows.length){const {error}=await cl.from(table).insert(rows);if(error)throw Error(table+' : '+error.message)}
  }
  if(s)s.textContent='Restauration terminée. Rechargez le portail sur vos appareils.';
  alert('Restauration terminée.');
 }catch(e){
  console.error('[Restauration complète]',e);
  if(s)s.textContent='Échec : '+e.message;
  alert('Restauration interrompue : '+e.message+'\\n\\nConservez votre fichier de sauvegarde.');
 }
}
function bindRestore(){
 const input=$('fullCloudRestore');if(!input)return;
 input.addEventListener('change',async e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  try{showPreview(validateBackup(JSON.parse(await f.text())));const s=$('fullCloudRestoreStatus');if(s)s.textContent='Fichier contrôlé. Vérifiez le résumé avant de restaurer.'}
  catch(err){const s=$('fullCloudRestoreStatus');if(s)s.textContent='Fichier invalide : '+err.message;alert('Fichier de sauvegarde invalide : '+err.message)}
  finally{e.target.value=''}
 });
}

document.addEventListener('DOMContentLoaded',()=>{const b=$('fullCloudBackup');if(b)b.addEventListener('click',run);bindRestore()});
})();