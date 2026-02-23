import { prisma } from './src/config/database';
import { UserRole } from './src/types/enums';

async function debugDashboard() {
    try {
        const telecaller = await prisma.user.findFirst({
            where: { role: UserRole.TELECALLER }
        });

        if (!telecaller) {
            console.log('No telecaller found');
            return;
        }

        const userId = telecaller.id;
        console.log('Testing for userId:', userId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log('Running groupBy on Lead...');
        const stats = await prisma.lead.groupBy({
            by: ['status'],
            where: { assignedToId: userId },
            _count: true
        });
        console.log('Stats:', stats);

        console.log('Running followUp today...');
        const followUpsToday = await prisma.followUp.findMany({
            where: {
                telecallerId: userId,
                scheduledDate: {
                    gte: today,
                    lt: new Date(today.getTime() + 86400000)
                },
                status: 'PENDING'
            },
            include: { lead: true }
        });
        console.log('FollowUpsToday count:', followUpsToday.length);

        console.log('Running followUp overdue...');
        const followUpsOverdue = await prisma.followUp.findMany({
            where: {
                telecallerId: userId,
                scheduledDate: { lt: today },
                status: 'PENDING'
            },
            include: { lead: true }
        });
        console.log('FollowUpsOverdue count:', followUpsOverdue.length);

        console.log('DB Check Success!');
    } catch (error: any) {
        console.error('DB Check Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugDashboard();
