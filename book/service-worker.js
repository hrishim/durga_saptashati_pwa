const CACHE='durga-flipbook-20261117-1';
const FILES=["./", "index.html", "flipbook.css", "flipbook.js", "book-data.js", "cover.jpg", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "noto-serif-devanagari-normal-devanagari.woff2", "noto-serif-devanagari-normal-latin-ext.woff2", "noto-serif-devanagari-normal-latin.woff2", "noto-serif-italic-latin-ext.woff2", "noto-serif-italic-latin.woff2", "noto-serif-normal-latin-ext.woff2", "noto-serif-normal-latin.woff2"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('durga-flipbook-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(e.request,{ignoreSearch:true});if(hit)return hit;
 if(e.request.mode==='navigate'){try{return await fetch(e.request)}catch{return c.match('index.html')}}return fetch(e.request)}));
});
