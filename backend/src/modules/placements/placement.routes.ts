import { Router } from 'express';
import {
  getPlacements,
  getPlacementById,
  createPlacement,
  updatePlacement,
  deletePlacement,
  updatePlacementStatus,
} from './placement.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';
import { requireTrainer } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/', getPlacements);
router.get('/:id', getPlacementById);
router.post('/', requireTrainer, createPlacement);
router.put('/:id', requireTrainer, updatePlacement);
router.delete('/:id', requireTrainer, deletePlacement);
router.patch('/:id/status', requireTrainer, updatePlacementStatus);

export default router;
