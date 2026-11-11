import { pool } from '../config/db.js';

export const transactionService = {
    // Ambil semua transaksi milik user dengan filter dinamis
    async getAll({ userId, month, year, type, category }) {
        let sql = 'SELECT * FROM transactions WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (userId) {
            sql += ` AND (user_id = $${paramIndex} OR user_id IS NULL)`;
            params.push(parseInt(userId));
            paramIndex++;
        }

        if (type) {
            sql += ` AND type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }

        if (category) {
            sql += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        sql += ' ORDER BY date DESC, id DESC';
        const result = await pool.query(sql, params);

        let filtered = result.rows.map(r => ({ ...r, amount: parseFloat(r.amount) }));

        if (month !== undefined && month !== null && year !== undefined && year !== null) {
            const mInt = parseInt(month);
            const yInt = parseInt(year);
            filtered = filtered.filter(item => {
                const [y, m] = item.date.split('-').map(Number);
                return (m - 1) === mInt && y === yInt;
            });
        }

        return filtered;
    },

    // Dapatkan ringkasan statistik keuangan
    async getSummary({ userId, month, year }) {
        const transactions = await this.getAll({ userId, month, year });

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryBreakdown = {};

        for (const t of transactions) {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
                categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
            }
        }

        const netBalance = totalIncome - totalExpense;

        return {
            totalIncome,
            totalExpense,
            netBalance,
            transactionCount: transactions.length,
            categoryBreakdown
        };
    },

    // Tambah transaksi baru
    async create({ userId, date, description, type, category, amount }) {
        if (!date || !description || !type || !category || !amount) {
            const err = new Error('Semua kolom transaksi (tanggal, deskripsi, jenis, kategori, nominal) wajib diisi!');
            err.statusCode = 400;
            throw err;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            const err = new Error('Nominal transaksi harus berupa angka lebih dari 0!');
            err.statusCode = 400;
            throw err;
        }

        const sql = `
            INSERT INTO transactions (user_id, date, description, type, category, amount)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(sql, [
            userId ? parseInt(userId) : null,
            date,
            description.trim(),
            type,
            category,
            parsedAmount
        ]);

        const item = result.rows[0];
        return {
            ...item,
            amount: parseFloat(item.amount)
        };
    },

    // Ubah / Edit transaksi yang sudah ada
    async update(id, userId, { date, description, type, category, amount }) {
        const parsedId = parseInt(id);
        const parsedAmount = parseFloat(amount);

        if (!date || !description || !type || !category || isNaN(parsedAmount) || parsedAmount <= 0) {
            const err = new Error('Semua kolom pembaruan wajib valid!');
            err.statusCode = 400;
            throw err;
        }

        let sql = `
            UPDATE transactions 
            SET date = $1, description = $2, type = $3, category = $4, amount = $5
            WHERE id = $6
        `;
        const params = [date, description.trim(), type, category, parsedAmount, parsedId];

        if (userId) {
            sql += ` AND (user_id = $7 OR user_id IS NULL)`;
            params.push(parseInt(userId));
        }

        sql += ' RETURNING *';

        const result = await pool.query(sql, params);
        if (result.rows.length === 0) {
            const err = new Error('Transaksi tidak ditemukan atau Anda tidak berwenang mengubahnya.');
            err.statusCode = 404;
            throw err;
        }

        const item = result.rows[0];
        return {
            ...item,
            amount: parseFloat(item.amount)
        };
    },

    // Hapus transaksi
    async delete(id, userId) {
        const parsedId = parseInt(id);
        let sql = 'DELETE FROM transactions WHERE id = $1';
        const params = [parsedId];

        if (userId) {
            sql += ` AND (user_id = $2 OR user_id IS NULL)`;
            params.push(parseInt(userId));
        }

        const result = await pool.query(sql, params);
        if (result.rowCount === 0) {
            const err = new Error('Transaksi tidak ditemukan atau sudah dihapus.');
            err.statusCode = 404;
            throw err;
        }

        return { id: parsedId, message: 'Transaksi berhasil dihapus' };
    }
};
