import { prisma } from './src/config/database';

async function checkUserSession() {
    try {
        const user = await prisma.user.findFirst({
            where: { email: 'telecaller2@fortune.com' },
            include: { branch: true }
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User Details:');
        console.log(`- Name: ${user.firstName} ${user.lastName}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- Branch ID: ${user.branchId}`);
        console.log(`- Branch Name: ${user.branch?.name}`);

        const leadCount = await prisma.lead.count({
            where: { branchId: user.branchId }
        });

        console.log(`\nLeads in this branch: ${leadCount}`);

        const leads = await prisma.lead.findMany({
            where: { branchId: user.branchId },
            take: 5,
            select: { id: true, firstName: true, status: true }
        });

        console.log('\nSample Leads:');
        leads.forEach(l => console.log(`- ${l.firstName} (${l.status}) [${l.id}]`));

    } catch (error) {
        console.error('Error checking user session:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserSession();
