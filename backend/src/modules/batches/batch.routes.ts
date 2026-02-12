import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { getBatches, getBatchById } from './batch.controller';

const router = Router();

router.use(authenticateToken);

router.get('/', getBatches);
router.get('/:id', getBatchById);

export default router;
