import { Router } from 'express';
import {
  getBranchReport,
  getTrainerReport,
  getAdmissionsReport,
  getPlacementsReport,
  getRevenueReport,
} from './report.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/branch', getBranchReport);
router.get('/trainer', getTrainerReport);
router.get('/admissions', getAdmissionsReport);
router.get('/placements', getPlacementsReport);
router.get('/revenue', getRevenueReport);

export default router;
