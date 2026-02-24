import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function audit() {
    const branches = await prisma.branch.findMany({
        where: { name: { contains: 'Salem' } }
    });

    console.log('--- Salem Branch Audit ---');
    for (const b of branches) {
        const leads = await prisma.lead.findMany({
            where: { branchId: b.id },
            select: { id: true, firstName: true, lastName: true, status: true }
        });
        console.log(`Branch: '${b.name}' (ID: ${b.id}, Code: ${b.code})`);
        console.log(`Leads (${leads.length}):`);
        leads.forEach(l => console.log(`  - ${l.firstName} ${l.lastName} [${l.status}] (ID: ${l.id})`));
    }

    const telecallers = await prisma.user.findMany({
        where: { role: 'TELECALLER', branchId: { in: branches.map(b => b.id) } }
    });
    console.log('\nTelecallers in Salem branches:');
    telecallers.forEach(t => console.log(`  - ${t.firstName} ${t.lastName} (BranchID: ${t.branchId})`));

    await prisma.$disconnect();
}

audit();
