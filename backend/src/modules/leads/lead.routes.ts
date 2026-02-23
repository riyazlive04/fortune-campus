import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToAdmission,
  createPublicLead,
  getTelecallerDashboard,
  getCPTelecallerAnalytics,
  getCEOTelecallerAnalytics,
  logCall,
  getCallLogs,
  getLeadStatusHistory,
} from './lead.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess, attachUserBranch } from '../../middlewares/branch.middleware';

const router = Router();

router.post('/public', createPublicLead);

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/dashboard/telecaller', getLeads); // Reusing getLeads with status filters or specific dashboard endpoint
router.get('/stats/telecaller', getTelecallerDashboard);
router.get('/stats/cp', getCPTelecallerAnalytics);
router.get('/stats/ceo', getCEOTelecallerAnalytics);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', attachUserBranch, createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/convert', convertLeadToAdmission);
router.post('/:id/calls', logCall);
router.get('/:id/calls', getCallLogs);
router.get('/:id/history', getLeadStatusHistory);

export default router;
