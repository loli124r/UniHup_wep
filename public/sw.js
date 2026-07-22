// Service Worker بسيط لـ UniHub Web — يوفّر:
// 1) شرط تثبيت PWA بالمتصفح (لازم SW فيه fetch handler).
// 2) تخزين مؤقت لغلاف التطبيق (shell) والأصول الثابتة، حتى تفتح
//    الصفحات اللي زرتها من قبل حتى بدون إنترنت (البيانات الحية من
//    Firebase تبقى تحتاج اتصال، هذا فقط لواجهة التطبيق نفسها).

const CACHE_NAME = "unihub-shell-v1";
const APP_SHELL = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // لا نتدخل بطلبات Firebase/Firestore/Supabase — تبقى شبكة مباشرة دائمًا
  if (url.origin !== self.location.origin) return;

  // شبكة أولاً، ورجوع للكاش لو ما فيه اتصال (يشمل صفحات HTML وملفات ثابتة)
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/manifest.json")))
  );
});
