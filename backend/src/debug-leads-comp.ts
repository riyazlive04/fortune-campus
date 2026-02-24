import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- Comprehensive Lead Status Debug ---');

    // Get all branches
    const branches = await prisma.branch.findMany({
        select: { id: true, name: true }
    });

    for (const branch of branches) {
        console.log(`\nBranch: ${branch.name} (${branch.id})`);

        // Count leads by status in this branch
        const statusCounts = await prisma.lead.groupBy({
            by: ['status'],
            where: { branchId: branch.id },
            _count: true
        });

        if (statusCounts.length === 0) {
            console.log('  No leads found.');
        } else {
            for (const sc of statusCounts) {
                console.log(`  Status: ${sc.status} -> Count: ${sc._count}`);
            }
        }
    }

    // Find Telecaller 2
    const telecaller = await prisma.user.findFirst({
        where: { firstName: { contains: 'Telecaller' } }, // Assuming the name is like Telecaller 2
        include: { branch: true }
    });

    if (telecaller) {
        console.log(`\nFound Telecaller: ${telecaller.firstName} ${telecaller.lastName}`);
        console.log(`Assigned Branch: ${telecaller.branch?.name} (${telecaller.branchId})`);

        // Check if branchId in user matches any branch ID
        const branchExists = await prisma.branch.findUnique({ where: { id: telecaller.branchId || '' } });
        console.log(`Branch exists in DB: ${Boolean(branchExists)}`);
    }

    await prisma.$disconnect();
}

debug();
