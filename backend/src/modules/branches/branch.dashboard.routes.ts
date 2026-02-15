
import { Router } from 'express';
import {
    getBranchOverview,
    getAdmissionsStats,
    getAttendanceStats,
    getProgressStats,
    getPortfolioStats,
    getTrainerStats,
    getFeeStats,
    getPlacementStats,
    getComplianceStats,
    getPlacementReadiness,
    convertLead,
    getBranchAttendance,
    updateAdmissionFees,
    getBranchReport,
    uploadBranchReport
} from './branch.dashboard.controller';
import { uploadReport } from '../../middlewares/upload.middleware';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/role.middleware';
import { UserRole } from '../../types/enums';

const router = Router();

// Protect all routes with authentication and Channel Partner/CEO role
router.use(authenticateToken);
router.use(requireRoles(UserRole.CHANNEL_PARTNER, UserRole.CEO, UserRole.ADMIN));

router.get('/overview', getBranchOverview);
router.get('/admissions', getAdmissionsStats);
router.post('/lead/convert', convertLead);
router.get('/attendance', getAttendanceStats);
router.get('/attendance/list', getBranchAttendance);
router.get('/progress', getProgressStats);
router.get('/portfolio', getPortfolioStats);
router.get('/trainers', getTrainerStats);
router.get('/fees', getFeeStats);
router.get('/placements', getPlacementStats);
router.get('/compliance', getComplianceStats);
router.get('/placement-readiness', getPlacementReadiness);
router.put('/admissions/:id/fees', updateAdmissionFees);
router.get('/reports/:type', getBranchReport);
router.post('/reports', uploadReport.single('file'), uploadBranchReport);

export default router;
