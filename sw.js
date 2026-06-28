const CACHE = 'jet3d-v3';

const PRECACHE = [
    './',
    './index.html',
    './assets/js/model-viewer.min.js',
    './assets/js/draco/draco_decoder.js',
    './assets/js/draco/draco_decoder.wasm',
    './assets/js/draco/draco_wasm_wrapper.js',
    './assets/model/fly.glb',
    './assets/favicon.svg',
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

function isImmutable(url) {
    return url.includes('/assets/js/model-viewer.min.js') ||
        url.includes('/assets/js/draco/') ||
        url.includes('/assets/model/') ||
        url.includes('/assets/favicon');
}

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    if (!req.url.startsWith(self.location.origin)) return;

    if (isImmutable(req.url)) {
        e.respondWith(
            caches.match(req).then(cached => cached || fetch(req).then(res => {
                if (res.ok) {
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put(req, clone));
                }
                return res;
            }))
        );
        return;
    }

    e.respondWith(
        fetch(req).then(res => {
            if (res.ok) {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(req, clone));
            }
            return res;
        }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
});
