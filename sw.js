const CACHE_NAME = "akujualan-v1";
const ASSETS_TO_CACHE = [
    "index.html",
    "akugambar/index.html",
    "akugambar/services.html",
    "akugambar/portfolio.html",
    "css/styles.css",
    "css/jar.css",
    "akujualan/css/style.css",
    "js/common.js",
    "js/index.js",
    "js/jar.js",
    "js/supabase.js",
    "js/config.js",
    "assets/favicon.png",
    "assets/akujualan-hero-new.png",
    "assets/head.png"
];

// Install Service Worker
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch Assets
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
