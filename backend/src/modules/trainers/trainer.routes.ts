import { Router } from 'express';
import {
  getTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from './trainer.controller';
import {
  getTrainerDashboardStats,
  getStudentsByBatch,
  checkBatchEligibility
} from './trainer.dashboard.controller';
import {
  getBatchProgress,
  updateStudentProgress
} from '../students/student.progress.controller';
import {
  createTest,
  getTestsByBatch,
  updateTestScores,
  getTestScores
} from './test.management.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';
import { requireBranchHead, requireTrainer } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

// Dashboard routes
router.get('/dashboard/stats', getTrainerDashboardStats);
router.get('/batches/:batchId/students', requireTrainer, getStudentsByBatch);

// Test Management routes
router.get('/batches/:batchId/tests', requireTrainer, getTestsByBatch);
router.post('/tests', requireTrainer, createTest);
router.get('/tests/:testId/scores', requireTrainer, getTestScores);
router.put('/tests/:testId/scores', requireTrainer, updateTestScores);

// Student Progress routes
router.get('/batches/:batchId/progress', requireTrainer, getBatchProgress);
router.put('/students/:studentId/progress', requireTrainer, updateStudentProgress);

// Placement Eligibility
router.post('/batches/:batchId/check-eligibility', requireTrainer, checkBatchEligibility);

router.get('/', getTrainers);
router.get('/:id', getTrainerById);
router.post('/', requireBranchHead, createTrainer);
router.put('/:id', requireBranchHead, updateTrainer);
router.delete('/:id', requireBranchHead, deleteTrainer);

export default router;
