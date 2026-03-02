import { Router } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getFeeRequests,
  approveFeeRequest,
  rejectFeeRequest,
  getFeeRequestById,
  sendFeeRequestToStudent
} from './student.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';
import { enforceBranchAccess } from '../../middlewares/branch.middleware';

const router = Router();

router.use(authenticateToken);
router.use(enforceBranchAccess);

router.get('/', getStudents);
router.get('/fees/requests', getFeeRequests);
router.get('/fees/requests/:id', getFeeRequestById);
router.put('/fees/requests/:id/approve', approveFeeRequest);
router.put('/fees/requests/:id/reject', rejectFeeRequest);
router.put('/fees/requests/:id/send', sendFeeRequestToStudent);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
