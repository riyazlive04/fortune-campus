import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getPublicCompanyList,
} from './company.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireBranchHead } from '../../middlewares/role.middleware';

const router = Router();

router.get('/public/list', getPublicCompanyList);

router.use(authenticateToken);

router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', requireBranchHead, createCompany);
router.put('/:id', requireBranchHead, updateCompany);
router.delete('/:id', requireBranchHead, deleteCompany);

export default router;
