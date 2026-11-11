import { authService } from '../services/authService.js';

export const authController = {
    // POST /api/auth/register
    async register(req, res, next) {
        try {
            const { username, password } = req.body;
            const newUser = await authService.register({ username, password });
            res.status(201).json({
                success: true,
                message: 'Pendaftaran akun berhasil!',
                data: newUser
            });
        } catch (error) {
            next(error);
        }
    },

    // POST /api/auth/login
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const user = await authService.login({ username, password });
            res.status(200).json({
                success: true,
                message: 'Login berhasil!',
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/auth/me?userId=123
    async getMe(req, res, next) {
        try {
            const userId = req.query.userId || req.headers['x-user-id'];
            if (!userId) {
                return res.status(400).json({ success: false, message: 'Parameter userId wajib disertakan.' });
            }

            const user = await authService.getUserById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
            }

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
};
