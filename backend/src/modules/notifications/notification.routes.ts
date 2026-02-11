import { Router } from 'express';
import { getNotifications, markAsRead, getWhatsappLogs } from './notification.controller';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead); // Use 'all' as :id to mark all as read
router.get('/whatsapp-logs', getWhatsappLogs);

export default router;
