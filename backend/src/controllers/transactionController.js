import { transactionService } from '../services/transactionService.js';

export const transactionController = {
    // GET /api/transactions
    async getAll(req, res, next) {
        try {
            const { userId, month, year, type, category } = req.query;
            const data = await transactionService.getAll({ userId, month, year, type, category });
            res.status(200).json({
                success: true,
                count: data.length,
                data
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/transactions/summary
    async getSummary(req, res, next) {
        try {
            const { userId, month, year } = req.query;
            const summary = await transactionService.getSummary({ userId, month, year });
            res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/transactions
    async create(req, res, next) {
        try {
            const { userId, date, description, type, category, amount } = req.body;
            const newTransaction = await transactionService.create({
                userId,
                date,
                description,
                type,
                category,
                amount
            });

            res.status(201).json({
                success: true,
                message: 'Transaksi berhasil ditambahkan!',
                data: newTransaction
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/transactions/:id
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { userId, date, description, type, category, amount } = req.body;
            const updated = await transactionService.update(id, userId, {
                date,
                description,
                type,
                category,
                amount
            });

            res.status(200).json({
                success: true,
                message: 'Transaksi berhasil diperbarui!',
                data: updated
            });
        } catch (error) {
            next(error);
        }
    },

    // DELETE /api/transactions/:id
    async remove(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.query.userId || req.body?.userId;
            const result = await transactionService.delete(id, userId);

            res.status(200).json({
                success: true,
                message: 'Transaksi berhasil dihapus!',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
};
