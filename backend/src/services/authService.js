import crypto from 'crypto';
import { pool } from '../config/db.js';

export function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

export const authService = {
    // Daftarkan user baru
    async register({ username, password }) {
        if (!username || !password || username.trim().length < 3 || password.trim().length < 4) {
            const err = new Error('Username minimal 3 karakter & Password minimal 4 karakter!');
            err.statusCode = 400;
            throw err;
        }

        const cleanUsername = username.trim();

        // Cek duplikasi username
        const existing = await pool.query('SELECT id FROM users WHERE username = $1', [cleanUsername]);
        if (existing.rows.length > 0) {
            const err = new Error('Username sudah digunakan. Silakan gunakan username lain atau login.');
            err.statusCode = 400;
            throw err;
        }

        const hashedPassword = hashPassword(password.trim());
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
            [cleanUsername, hashedPassword]
        );

        return result.rows[0];
    },

    // Login user
    async login({ username, password }) {
        if (!username || !password) {
            const err = new Error('Username dan password wajib diisi!');
            err.statusCode = 400;
            throw err;
        }

        const cleanUsername = username.trim();
        const hashedPassword = hashPassword(password.trim());

        const result = await pool.query(
            'SELECT id, username, created_at FROM users WHERE username = $1 AND password = $2',
            [cleanUsername, hashedPassword]
        );

        if (result.rows.length === 0) {
            const err = new Error('Username atau Password salah!');
            err.statusCode = 401;
            throw err;
        }

        return result.rows[0];
    },

    // Dapatkan data user berdasarkan ID
    async getUserById(id) {
        const result = await pool.query('SELECT id, username, created_at FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) return null;
        return result.rows[0];
    }
};
