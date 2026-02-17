
import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import {
    getBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    assignStudentsToBatch,
    removeStudentFromBatch
} from './batch.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getBatches);
router.post('/', createBatch);
router.get('/:id', getBatchById);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

// Student Assignment Routes
router.post('/:id/students', assignStudentsToBatch);
router.delete('/:id/students/:studentId', removeStudentFromBatch);

export default router;
