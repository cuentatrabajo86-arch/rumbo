// Service worker — cachea el "shell" de la app para que funcione offline,
// pero SIEMPRE prioriza traer la versión más reciente cuando hay internet.
// (Antes priorizaba la copia guardada, lo que podía dejar una pestaña
// mostrando una versión vieja de Rumbo si nunca se cerraba del todo.)
// El nombre de la caché sube de versión en cada release para limpiar
// cachés viejas al activar (ver "activate" más abajo).

const CACHE_NAME = 'rumbo-v13';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  event.respondWith(
    fetch(event.request).then(function(respuestaDeRed){
      // Hay internet: usar la versión fresca y guardarla para la próxima
      // vez que no haya conexión.
      var copiaParaGuardar = respuestaDeRed.clone();
      caches.open(CACHE_NAME).then(function(cache){
        cache.put(event.request, copiaParaGuardar);
      });
      return respuestaDeRed;
    }).catch(function(){
      // Sin internet: usar lo último que se guardó.
      return caches.match(event.request);
    })
  );
});
