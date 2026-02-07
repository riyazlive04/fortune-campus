import { Router } from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  assignTrainerToCourse,
  removeTrainerFromCourse,
} from './course.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess, attachUserBranch } from '../../middlewares/branch.middleware';
import { requireBranchHead } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', requireBranchHead, attachUserBranch, createCourse);
router.put('/:id', requireBranchHead, updateCourse);
router.delete('/:id', requireBranchHead, deleteCourse);
router.post('/:id/trainers', requireBranchHead, assignTrainerToCourse);
router.delete('/:id/trainers/:trainerId', requireBranchHead, removeTrainerFromCourse);

export default router;
