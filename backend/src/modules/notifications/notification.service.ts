
import { prisma } from '../../config/database';

export class NotificationService {
    /**
     * Create a notification for a user
     */
    static async createNotification(data: {
        recipientId: string;
        title: string;
        message: string;
        type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
        link?: string;
    }) {
        try {
            return await prisma.notification.create({
                data: {
                    recipientId: data.recipientId,
                    title: data.title,
                    message: data.message,
                    type: data.type,
                    link: data.link,
                    isRead: false,
                },
            });
        } catch (error) {
            console.error('Failed to create notification:', error);
            // We don't want to throw here to avoid blocking the main action
            return null;
        }
    }

    /**
     * Create a notification for all users with a specific role
     */
    static async notifyRole(role: string, data: {
        title: string;
        message: string;
        type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
        link?: string;
    }) {
        try {
            const users = await prisma.user.findMany({
                where: { role, isActive: true },
                select: { id: true },
            });

            if (users.length === 0) return;

            const notifications = users.map(user => ({
                recipientId: user.id,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link,
                isRead: false,
            }));

            return await prisma.notification.createMany({
                data: notifications,
            });
        } catch (error) {
            console.error(`Failed to notify role ${role}:`, error);
            return null;
        }
    }

    /**
     * Create a notification for all users in a specific branch with a specific role
     */
    static async notifyBranchRole(branchId: string, role: string, data: {
        title: string;
        message: string;
        type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
        link?: string;
    }) {
        try {
            const users = await prisma.user.findMany({
                where: { branchId, role, isActive: true },
                select: { id: true },
            });

            if (users.length === 0) return;

            const notifications = users.map(user => ({
                recipientId: user.id,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link,
                isRead: false,
            }));

            return await prisma.notification.createMany({
                data: notifications,
            });
        } catch (error) {
            console.error(`Failed to notify branch role ${role}:`, error);
            return null;
        }
    }
}
