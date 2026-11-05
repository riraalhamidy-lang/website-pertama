// File: config.js (VERSI UJI COBA)
const SCRIPT_URL_UTAMA = 'https://script.google.com/macros/s/AKfycbzC2Sxv6MJF3yq7F6HYJ6dn6yA35nHwwtKDAagLfWLWV26t9bY_Bjk0lBoHi5N9_5OO/exec';
const SCRIPT_URL_KEAMANAN = 'https://script.google.com/macros/s/AKfycbz5RqrA27owZDsTDKHqEHA3LIGykiJsecVejwEjUHaCDm0qllur3nIm4NWLxYF6v6fuEQ/exec';

// --- SISTEM TEMA OTOMATIS GLOBAL ---
const temaTersimpan = localStorage.getItem('temaPortal') || 'dark';
if (temaTersimpan === 'light') {
    document.body.classList.add('theme-light');
} else {
    document.body.classList.remove('theme-light');
}