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
     {format:'portail-st-cyr-backup',format_version:1,portal_version:'V6.8.1.3',exported_at:now.toISOString(),tables});
  if(s)s.textContent='Sauvegarde complète téléchargée.';
 }catch(e){console.error('[Sauvegarde complète]',e);if(s)s.textContent='Échec : '+e.message;alert('Sauvegarde impossible : '+e.message)}
 finally{b.disabled=false}
}
document.addEventListener('DOMContentLoaded',()=>{const b=$('fullCloudBackup');if(b)b.addEventListener('click',run)});
})();