
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listChannelPartners() {
    try {
        const partners = await prisma.user.findMany({
            where: {
                role: 'CHANNEL_PARTNER'
            },
            include: {
                branch: true
            }
        });

        console.log('--- Channel Partners Report ---');
        console.log(`Total Partners Found: ${partners.length}`);

        partners.forEach(p => {
            console.log(`ID: ${p.id}`);
            console.log(`Email: ${p.email}`);
            console.log(`Name: ${p.firstName} ${p.lastName}`);
            console.log(`Branch ID: ${p.branchId || 'MISSING ❌'}`);
            console.log(`Branch Name: ${p.branch?.name || 'N/A'}`);
            console.log('-----------------------------------');
        });

    } catch (error) {
        console.error('Error fetching partners:', error);
    } finally {
        await prisma.$disconnect();
    }
}

listChannelPartners();
