
import { Router } from 'express';
import {
    getBranchOverview,
    getAdmissionsStats,
    getAttendanceStats,
    getProgressStats,
    getPortfolioStats,
    getTrainerStats,
    getFeeStats,
    getPlacementStats
} from './branch.dashboard.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/role.middleware';
import { UserRole } from '../../types/enums';

const router = Router();

// Protect all routes with authentication and Channel Partner/CEO role
router.use(authenticateToken);
router.use(requireRoles(UserRole.CHANNEL_PARTNER, UserRole.CEO, UserRole.ADMIN));

router.get('/overview', getBranchOverview);
router.get('/admissions', getAdmissionsStats);
router.get('/attendance', getAttendanceStats);
router.get('/progress', getProgressStats);
router.get('/portfolio', getPortfolioStats);
router.get('/trainers', getTrainerStats);
router.get('/fees', getFeeStats);
router.get('/placements', getPlacementStats);

export default router;
