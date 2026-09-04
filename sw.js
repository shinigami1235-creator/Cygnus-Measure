/* Cygnus Measurement Tool — service worker.

   Two jobs. It makes the program installable, so a clinician presses Add to
   Home Screen and gets an icon that opens with no address bar. And it keeps
   a copy of the program on the device, so a treatment room with no signal is
   not a reason the measurement cannot be taken.

   Nothing patient related is cached here. The program has no server side:
   photographs, marks and results live in the page and in the file the
   examiner saves. This worker only holds the program itself and the face
   model it downloads once. */

const VERSION = '2.5.1';
const SHELL   = 'cygnus-measure-shell-' + VERSION;
const VENDOR  = 'cygnus-measure-vendor-v1';   // the face model, kept across updates

const SHELL_FILES = [
  './',
  './index.html',
  './measurement-protocol.html',
  './manifest.json',
  './favicon.ico',
  './favicon-32.png',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

/* the face finder and its model. Large, slow to fetch, and identical every
   time, so once it has been through the wire it is kept. */
const isVendor = url =>
  url.hostname === 'cdn.jsdelivr.net' ||
  (url.hostname === 'storage.googleapis.com' && url.pathname.includes('mediapipe-models'));

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    /* one at a time, so a single failure does not throw the whole install away */
    await Promise.all(SHELL_FILES.map(f => c.add(new Request(f, {cache:'reload'})).catch(()=>{})));
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keep = new Set([SHELL, VENDOR]);
    for (const k of await caches.keys()) if (!keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* Opening the program: try the network first so a redeploy is picked up on
     the next launch, and fall back to the stored copy when there is no
     signal. */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(SHELL);
        c.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        return (await caches.match('./index.html')) ||
               (await caches.match('./')) ||
               new Response('Offline and no stored copy of the program.',
                            {status:503, headers:{'Content-Type':'text/plain'}});
      }
    })());
    return;
  }

  if (isVendor(url)) {
    e.respondWith((async () => {
      const c = await caches.open(VENDOR);
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
      return res;
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const c = await caches.open(SHELL);
      const hit = await c.match(req);
      if (hit) {
        /* refresh it quietly for next time */
        fetch(req).then(r => { if (r && r.ok) c.put(req, r); }).catch(()=>{});
        return hit;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) c.put(req, res.clone());
        return res;
      } catch {
        return new Response('', {status:504});
      }
    })());
  }
});
