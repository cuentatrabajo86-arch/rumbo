/* Rumbo — service worker: cache-first para la carcasa, red para el resto */
var CACHE = "rumbo-v2";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(ARCHIVOS.map(function(u){
        return c.add(u).catch(function(){});
      }));
    })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){
        if(k !== CACHE) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;

  e.respondWith(
    caches.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && res.status === 200 && (res.type === "basic" || res.type === "cors")){
          var copia = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copia).catch(function(){}); });
        }
        return res;
      }).catch(function(){
        if(req.mode === "navigate") return caches.match("./index.html");
        return new Response("", {status:503});
      });
    })
  );
});
