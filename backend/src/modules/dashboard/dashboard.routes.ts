
import { Router } from 'express';
import { getDashboardStats } from './dashboard.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/stats', getDashboardStats);

export default router;
