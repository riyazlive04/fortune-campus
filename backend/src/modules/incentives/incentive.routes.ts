import { Router } from 'express';
import {
  getIncentives,
  getIncentiveById,
  createIncentive,
  updateIncentive,
  deleteIncentive,
  markIncentivePaid,
} from './incentive.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';
import { requireBranchHead } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/', getIncentives);
router.get('/:id', getIncentiveById);
router.post('/', requireBranchHead, createIncentive);
router.put('/:id', requireBranchHead, updateIncentive);
router.delete('/:id', requireBranchHead, deleteIncentive);
router.patch('/:id/paid', requireBranchHead, markIncentivePaid);

export default router;
