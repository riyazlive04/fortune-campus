import { Router } from 'express';
import * as trainerAttendanceController from './trainer.attendance.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { requireBranchHead } from '../../middlewares/role.middleware';

const router = Router();

// Only Branch Heads (Channel Partners) and CEOs can mark/view trainer attendance
router.use(authenticateToken);

router.post('/mark', requireBranchHead, trainerAttendanceController.markTrainerAttendance);
router.get('/history', requireBranchHead, trainerAttendanceController.getTrainerAttendance);

export default router;
