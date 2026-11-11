import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:rioganteng123@db.poywteaeqoxqdopxekwq.supabase.co:5432/postgres';

export const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Inisialisasi Tabel di Supabase PostgreSQL
export async function initDatabase() {
    try {
        const client = await pool.connect();
        
        // 1. Buat tabel users jika belum ada
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Buat tabel transactions jika belum ada
        await client.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                date VARCHAR(20) NOT NULL,
                description VARCHAR(255) NOT NULL,
                type VARCHAR(20) NOT NULL,
                category VARCHAR(50) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        client.release();
        console.log(`✅ [Database Supabase] Berhasil terhubung ke PostgreSQL Supabase!`);
    } catch (error) {
        console.error(`❌ [Database Supabase Error] Gagal terhubung ke Supabase:`, error.message);
        throw error;
    }
}
