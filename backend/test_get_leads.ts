import { prisma } from './src/config/database';
import { UserRole } from './src/types/enums';

async function testGetLeads() {
    try {
        const userEmail = 'telecaller2@fortune.com';
        const user = await prisma.user.findFirst({ where: { email: userEmail } });
        if (!user) {
            console.log('User not found');
            return;
        }

        const where: any = {};
        if (user.role !== UserRole.CEO) {
            where.branchId = user.branchId;
        }

        console.log('Testing prisma.lead.findMany with where:', where);

        const leads = await prisma.lead.findMany({
            where,
            include: {
                branch: {
                    select: { id: true, name: true, code: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`Successfully fetched ${leads.length} leads.`);
    } catch (error: any) {
        console.error('Prisma Error Detected:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testGetLeads();
