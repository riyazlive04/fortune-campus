import { Router } from 'express';
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch } from './branch.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getBranches);
router.get('/:id', getBranchById);

// Only ADMIN can manage branches
router.post('/', requireAdmin, createBranch);
router.put('/:id', requireAdmin, updateBranch);
router.delete('/:id', requireAdmin, deleteBranch);

export default router;
