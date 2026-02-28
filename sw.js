const CACHE_NAME = 'neuro-guide-v1'; // не забывай увеличивать версию при обновлении сайта!
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // если есть другие статические файлы (CSS, JS, картинки) — добавь их сюда же
];

// Установка: кэшируем базовые файлы и сразу активируем нового воркера
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // новый воркер активируется немедленно
  );
});

// Активация: удаляем старые кэши и берём под контроль все открытые вкладки
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => clients.claim()) // сразу начинаем управлять страницами
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Для навигационных запросов (переход по ссылке, обновление страницы)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request) // сначала пытаемся загрузить с сервера
        .then((response) => {
          // Опционально: обновляем кэш для index.html (чтобы при офлайне была последняя версия)
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(request)) // если сеть упала — берём из кэша
    );
    return;
  }

  // Для всех остальных запросов (CSS, JS, картинки, манифест и т.д.) — сначала кэш, потом сеть
  event.respondWith(
    caches.match(request).then((response) => response || fetch(request))
  );
});
