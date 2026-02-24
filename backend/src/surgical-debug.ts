import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- Surgical Debug: Salem Branch & Telecaller 2 ---');

    // 1. List all branches with 'Salem' in name
    const salemBranches = await prisma.branch.findMany({
        where: { name: { contains: 'Salem' } }
    });
    console.log('Salem Branches found:', salemBranches.map(b => ({ id: b.id, name: `'${b.name}'`, code: b.code })));

    // 2. Find Telecaller 2
    const t2 = await prisma.user.findFirst({
        where: { OR: [{ firstName: { contains: 'Telecaller' } }, { lastName: { contains: 'Telecaller' } }] },
        include: { branch: true }
    });

    if (t2) {
        console.log(`\nUser: ${t2.firstName} ${t2.lastName} (ID: ${t2.id})`);
        console.log(`User Role: ${t2.role}`);
        console.log(`User Branch: '${t2.branch?.name}' (ID: ${t2.branchId})`);

        // 3. Count leads for this user's branchId
        const branchLeadsCount = await prisma.lead.count({ where: { branchId: t2.branchId || '' } });
        console.log(`Total leads for User's branchId (${t2.branchId}): ${branchLeadsCount}`);

        // 4. Count leads for this user specifically (if assigned)
        const assignedLeadsCount = await prisma.lead.count({ where: { assignedToId: t2.id } });
        console.log(`Total leads specifically assigned to User (assignedToId: ${t2.id}): ${assignedLeadsCount}`);

        // 5. List sample leads in that branch
        const sampleLeads = await prisma.lead.findMany({
            where: { branchId: t2.branchId || '' },
            take: 10,
            select: { id: true, firstName: true, status: true, assignedToId: true }
        });
        console.log('\nSample Leads in Branch:', JSON.stringify(sampleLeads, null, 2));
    } else {
        console.log('\nTelecaller 2 not found by name filter.');
    }

    await prisma.$disconnect();
}

debug();
