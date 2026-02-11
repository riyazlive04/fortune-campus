import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteProfile,
  adminUpdateUserProfile,
  adminResetUserPassword,
} from './profile.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);

// User's own profile
router.get('/', getProfile);
router.put('/', updateProfile);
router.put('/password', changePassword);
router.delete('/', deleteProfile);

// Admin operations
router.put('/users/:id', requireAdmin, adminUpdateUserProfile);
router.put('/users/:id/password', requireAdmin, adminResetUserPassword);

export default router;
