const CACHE='portail-st-cyr-v6.6.18.2-annuaire-category-sync-reunions-correctif';
const ASSETS=['./','./index.html','./manifest.webmanifest','./js/01-pilotage.js','./js/04-navigation-bibliotheque.js','./js/05-mobile.js','./js/06-supabase-securite-sync.js','./js/07-pwa.js','./js/07-supabase-connection-indicator.js','./js/08-annuaire.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);
 if(u.origin!==location.origin)return;
 event.respondWith(fetch(event.request).then(r=>{
   if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
   return r;
 }).catch(()=>caches.match(event.request).then(r=>r||caches.match('./index.html'))));
});
