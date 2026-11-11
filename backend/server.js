import app from './src/app.js';
import { initDatabase } from './src/config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function bootstrap() {
    try {
        // Inisialisasi Database
        await initDatabase();

        // Jalankan Server HTTP
        app.listen(PORT, () => {
            console.log(`==================================================`);
            console.log(`🚀 [HematKu Backend] Berjalan di Port ${PORT}`);
            console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
            console.log(`📂 Struktur: Controller, Service, Route, Config`);
            console.log(`==================================================`);
        });
    } catch (err) {
        console.error('❌ Gagal menjalankan server backend:', err);
        process.exit(1);
    }
}

bootstrap();
