import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from './user.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireBranchHead, requireRoles } from '../../middlewares/role.middleware';
import { UserRole } from '../../types/enums';

const router = Router();

router.use(authenticateToken);
router.post('/', requireBranchHead, createUser);
router.get('/', requireRoles(UserRole.CEO, UserRole.ADMIN, UserRole.CHANNEL_PARTNER, UserRole.TELECALLER), getUsers);
router.get('/:id', requireBranchHead, getUserById);
router.put('/:id', requireBranchHead, updateUser);
router.delete('/:id', requireBranchHead, deleteUser);

export default router;
