import { Router } from 'express';
import {
  getPortfolios,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  verifyPortfolio,
} from './portfolio.controller';
import {
  getPortfolioTasksByCourse,
  createPortfolioTask,
  submitPortfolioWork,
  getPendingPortfolioSubmissions,
  reviewPortfolioSubmission,
  getBranchPortfolioStats,
  getStudentPortfolioDetails
} from './portfolio.tasks.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';
import { requireTrainer, requireStudent } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

// Task-based Portfolio Routes
router.get('/tasks/:courseId', getPortfolioTasksByCourse);
router.post('/tasks', requireTrainer, createPortfolioTask);
router.post('/submit', requireStudent, submitPortfolioWork);
router.get('/pending', requireTrainer, getPendingPortfolioSubmissions);
router.get('/stats', requireTrainer, getBranchPortfolioStats);
router.get('/student/:studentId', requireTrainer, getStudentPortfolioDetails);
router.put('/review/:id', requireTrainer, reviewPortfolioSubmission);

// Legacy Portfolio Routes
router.get('/', getPortfolios);
router.get('/:id', getPortfolioById);
router.post('/', createPortfolio);
router.put('/:id', updatePortfolio);
router.delete('/:id', deletePortfolio);
router.post('/:id/verify', requireTrainer, verifyPortfolio);

export default router;
