import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkLeads() {
    try {
        const user = await prisma.user.findFirst({ where: { email: 'telecaller2@fortune.com' } });
        if (!user) {
            console.log('User telecaller2@fortune.com not found');
            return;
        }
        console.log('User found ID:', user.id);
        console.log('User Branch:', user.branchId);

        const leads = await prisma.lead.findMany({
            where: { assignedToId: user.id }
        });
        console.log(`COUNT: ${leads.length}`);
        leads.forEach(l => {
            console.log(`LEAD: ${l.firstName} ${l.lastName} | STATUS: ${l.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLeads();
