const CACHE_NAME = 'ataallum-v2.1';
const assets = [
  './',
  './index.html',
  './portal.html',
  './absen.html',
  './admin.html',
  // Jika masih ada file HTML lain seperti game, masukkan juga di sini
  
  // -- FOLDER CSS --
  './css/index.css',
  './css/portal.css',
  './css/absen.css',
  './css/admin.css',
  // Masukkan CSS lain yang Anda punya di dalam folder css
  
  // -- FOLDER JS --
  './js/config.js',     // Wajib dimasukkan agar HP murid menyimpan URL terbaru
  './js/index.js',
  './js/portal.js',
  './js/absen.js',
  './js/admin.js',
  // Masukkan JS lain yang Anda punya di dalam folder js
  
  // -- ASET GAMBAR --
  './aset/logo.png',
  './aset/taalo.png'
  // Masukkan semua nama file gambar yang dipakai di web
];

// Jalankan pemasangan mesin cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

// Jalankan satpam internal buat nangkep fetch data
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
