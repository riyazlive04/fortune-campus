import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    const targetBranchId = '5b533e4c-1e6a-4972-8700-647837db8cf5'; // 'Salem'

    console.log(`Consolidating Telecaller 2 into branch: ${targetBranchId}...`);

    try {
        // 1. Find Telecaller 2
        const t2 = await prisma.user.findFirst({
            where: { OR: [{ firstName: { contains: 'Telecaller' } }, { lastName: { contains: 'Telecaller' } }] }
        });

        if (t2) {
            await prisma.user.update({
                where: { id: t2.id },
                data: { branchId: targetBranchId }
            });
            console.log(`Updated User ${t2.firstName} ${t2.lastName} (ID: ${t2.id}) to branch ${targetBranchId}.`);
        } else {
            console.log('Telecaller 2 not found.');
        }

        // 2. Also move any leads that might be in the wrong branch
        const sourceBranchId = '1e736840-e93c-4259-8fd7-c24c28b14413'; // 'Salem '
        const updatedLeads = await prisma.lead.updateMany({
            where: { branchId: sourceBranchId },
            data: { branchId: targetBranchId }
        });
        console.log(`Updated ${updatedLeads.count} leads to branch ${targetBranchId}.`);

        console.log('Surgical migration completed.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
