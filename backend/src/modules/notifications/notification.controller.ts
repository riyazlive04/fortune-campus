
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { AutomationWorker } from './automation.worker';


export const getNotifications = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return errorResponse(res, 'User not identified', 401);
        }

        const { page = 1, limit = 10 } = req.query;
        const { skip, take } = paginationHelper(Number(page), Number(limit));

        const where = { recipientId: userId };

        const [notifications, total] = await Promise.all([
            prisma.notification.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.notification.count({ where }),
        ]);

        const unreadCount = await prisma.notification.count({
            where: { recipientId: userId, isRead: false }
        });


        const meta = getPaginationMeta(total, Number(page), Number(limit));

        return successResponse(res, { notifications, unreadCount, meta }, 'Notifications fetched successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to fetch notifications', 500, error);
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return errorResponse(res, 'User not identified', 401);
        }

        // Mark specific notification
        if (id && id !== 'all') {
            const notification = await prisma.notification.findUnique({
                where: { id }
            });

            if (!notification) {
                return errorResponse(res, 'Notification not found', 404);
            }

            if (notification.recipientId !== userId) {
                return errorResponse(res, 'Unauthorized', 403);
            }

            await prisma.notification.update({
                where: { id },
                data: { isRead: true }
            });
        }
        // Mark all as read
        else if (id === 'all') {
            await prisma.notification.updateMany({
                where: { recipientId: userId, isRead: false },
                data: { isRead: true }
            });
        }

        return successResponse(res, null, 'Marked as read successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to mark notifications as read', 500, error);
    }
};

export const getWhatsappLogs = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const { skip, take } = paginationHelper(Number(page), Number(limit));

        const where: any = {};

        // Branch filtering
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CEO') {
            where.OR = [
                { lead: { branchId: req.user?.branchId } },
                { admission: { branchId: req.user?.branchId } }
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.whatsAppLog.findMany({
                where,
                skip,
                take,
                orderBy: { sentAt: 'desc' },
                include: {
                    lead: {
                        select: { firstName: true, lastName: true }
                    },
                    admission: {
                        select: { firstName: true, lastName: true }
                    }
                }
            }),
            prisma.whatsAppLog.count({ where }),
        ]);

        const meta = getPaginationMeta(total, Number(page), Number(limit));

        return successResponse(res, { logs, meta });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch WhatsApp logs', 500, error);
    }
};

export const runAutomationChecks = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        if (req.user?.role !== 'ADMIN' && req.user?.role !== 'CEO') {
            return errorResponse(res, 'Unauthorized', 403);
        }

        await AutomationWorker.runAllChecks();
        return successResponse(res, null, 'Automation checks completed successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to run automation checks', 500, error);
    }
};
