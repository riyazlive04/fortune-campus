import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToAdmission,
  createPublicLead,
} from './lead.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess, attachUserBranch } from '../../middlewares/branch.middleware';

const router = Router();

router.post('/public', createPublicLead);

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', attachUserBranch, createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/convert', convertLeadToAdmission);

export default router;
