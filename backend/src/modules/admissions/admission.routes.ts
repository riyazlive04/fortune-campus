import { Router } from 'express';
import {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  approveAdmission,
} from './admission.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess, attachUserBranch } from '../../middlewares/branch.middleware';
import { requireBranchHead } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/', getAdmissions);
router.get('/:id', getAdmissionById);
router.post('/', attachUserBranch, createAdmission);
router.put('/:id', updateAdmission);
router.delete('/:id', requireBranchHead, deleteAdmission);
router.post('/:id/approve', requireBranchHead, approveAdmission);

export default router;
