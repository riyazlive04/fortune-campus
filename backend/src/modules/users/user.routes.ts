import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from './user.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireBranchHead } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireBranchHead);

router.post('/', createUser);
router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
