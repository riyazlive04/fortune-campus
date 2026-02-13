import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/role.middleware';
import {
    getStudentOverview,
    getStudentAttendance,
    getStudentProgress,
    getStudentPortfolio,
    submitPortfolio,
    getStudentTests,
    getStudentFees,
    getStudentNotifications,
} from './student.dashboard.controller';
import { UserRole } from '../../types/enums';

const router = Router();

// Authentication required for all routes
router.use(authenticateToken);

// Only /dashboard routes require the STUDENT role
router.use('/dashboard', requireRoles(UserRole.STUDENT));

// Dashboard endpoints
router.get('/dashboard/overview', getStudentOverview);
router.get('/dashboard/attendance', getStudentAttendance);
router.get('/dashboard/progress', getStudentProgress);
router.get('/dashboard/portfolio', getStudentPortfolio);
router.post('/dashboard/portfolio/submit', submitPortfolio);
router.get('/dashboard/tests', getStudentTests);
router.get('/dashboard/fees', getStudentFees);
router.get('/dashboard/notifications', getStudentNotifications);

export default router;
