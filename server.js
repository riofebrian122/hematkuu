// =================================================================
// HEMATKU - ROOT ENTRY POINT FORWARDER
// Meneruskan eksekusi ke arsitektur backend baru: backend/server.js
// =================================================================

import('./backend/server.js').catch(err => {
    console.error('Gagal menjalankan backend dari root:', err);
});
