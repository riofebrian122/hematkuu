import { Router } from 'express';
import authRoutes from './authRoutes.js';
import transactionRoutes from './transactionRoutes.js';
import { authController } from '../controllers/authController.js';
import { transactionController } from '../controllers/transactionController.js';

const router = Router();

// Modular Routes
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);

// Alias rute langsung untuk kompatibilitas ke belakang (Backward Compatibility)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getMe);

router.get('/transactions', transactionController.getAll);
router.post('/transactions', transactionController.create);
router.put('/transactions/:id', transactionController.update);
router.delete('/transactions/:id', transactionController.remove);

export default router;
