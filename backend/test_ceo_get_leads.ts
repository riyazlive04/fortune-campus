import { prisma } from './src/config/database';
import { UserRole } from './src/types/enums';

async function testAsCEO() {
    try {
        const ceo = await prisma.user.findFirst({ where: { role: UserRole.CEO } });
        if (!ceo) {
            console.log('CEO user not found');
            return;
        }
        console.log('Testing as CEO:', ceo.email);

        const where: any = {};
        // Simulate CEO logic (no branch filter if branchId not provided)

        console.log('Running prisma.lead.findMany with empty where');
        const leads = await prisma.lead.findMany({
            where,
            include: {
                branch: { select: { id: true, name: true, code: true } },
                createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
                assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
            }
        });
        console.log(`SUCCESS: Fetched ${leads.length} leads total.`);

    } catch (error: any) {
        console.error('FAILED:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testAsCEO();
