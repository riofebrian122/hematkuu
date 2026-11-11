import { Router } from 'express';
import { transactionController } from '../controllers/transactionController.js';

const router = Router();

router.get('/', transactionController.getAll);
router.get('/summary', transactionController.getSummary);
router.post('/', transactionController.create);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.remove);

export default router;
