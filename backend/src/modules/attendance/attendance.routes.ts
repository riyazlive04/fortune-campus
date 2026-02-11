import { Router } from 'express';
import {
  getAttendance,
  getAttendanceById,
  markAttendance,
  bulkMarkAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
} from './attendance.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';
import { requireTrainer } from '../../middlewares/role.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/stats', getAttendanceStats); // Specific route before parameterized route
router.get('/', getAttendance);
router.get('/:id', getAttendanceById);
router.post('/', requireTrainer, markAttendance);
router.post('/bulk', requireTrainer, bulkMarkAttendance);
router.put('/:id', requireTrainer, updateAttendance);
router.delete('/:id', requireTrainer, deleteAttendance);

export default router;
