const CACHE='portail-st-cyr-v6.2.31.4-voyant-parametres';
const ASSETS=['./','./index.html','./manifest.webmanifest','./js/01-pilotage.js','./js/04-navigation-bibliotheque.js','./js/05-mobile.js','./js/06-supabase-securite-sync.js','./js/07-pwa.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r}).catch(()=>caches.match('./index.html')));return;
 }
 const u=new URL(event.request.url);
 if(u.origin===location.origin){event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return r})));}
});
