import { Router } from 'express';
import {
  getBranchReport,
  getTrainerReport,
  getAdmissionsReport,
  getPlacementsReport,
  getRevenueReport,
} from './report.controller';
import {
  submitGrowthReport,
  getStudentGrowthReports,
  submitFileReport,
  getTrainerPerformance,
} from './student-growth.controller';
import {
  getDailyAdmissions,
  getFeesPending,
  getPlacementEligible,
  getExpenseReport,
  submitExpense,
  getSocialEngagement,
  submitEventPlan,
} from './branch-workflow.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

// Growth & Performance Routes
router.post('/growth', submitGrowthReport);
router.get('/growth/:studentId', getStudentGrowthReports);
router.post('/files', submitFileReport);
router.get('/performance', getTrainerPerformance);

// Standard Reports
router.get('/branch', getBranchReport);
router.get('/trainer', getTrainerReport);
router.get('/admissions', getAdmissionsReport);
router.get('/placements', getPlacementsReport);
router.get('/revenue', getRevenueReport);

// Branch Workflow Specific Reports
router.get('/daily-admissions', getDailyAdmissions);
router.get('/fees-pending', getFeesPending);
router.get('/placement-eligible', getPlacementEligible);
router.get('/expenses', getExpenseReport);
router.post('/expenses', submitExpense);
router.get('/social-engagement', getSocialEngagement);
router.post('/event-plan', submitEventPlan);

export default router;
