import { Router } from 'express';
import {
  getTrainers,
  getTrainerById,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from './trainer.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';
import { requireBranchHead } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/', getTrainers);
router.get('/:id', getTrainerById);
router.post('/', requireBranchHead, createTrainer);
router.put('/:id', requireBranchHead, updateTrainer);
router.delete('/:id', requireBranchHead, deleteTrainer);

export default router;
