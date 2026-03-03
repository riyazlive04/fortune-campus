import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dump() {
    const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
    const branchMap = Object.fromEntries(branches.map(b => [b.id, b.name]));

    const leads = await prisma.lead.findMany({
        select: { id: true, status: true, branchId: true, firstName: true }
    });

    console.log(`Total Leads: ${leads.length}`);

    const distribution: any = {};
    leads.forEach(l => {
        const bName = branchMap[l.branchId] || 'Unknown';
        if (!distribution[bName]) distribution[bName] = {};
        if (!distribution[bName][l.status]) distribution[bName][l.status] = 0;
        distribution[bName][l.status]++;
    });

    console.log('Lead Distribution:');
    console.log(JSON.stringify(distribution, null, 2));

    // Find Telecallers
    const telecallers = await prisma.user.findMany({
        where: { role: 'TELECALLER' },
        select: { firstName: true, branchId: true }
    });
    console.log('Telecallers:', telecallers.map(t => ({ name: t.firstName, branch: branchMap[t.branchId || ''] || 'Unknown' })));

    await prisma.$disconnect();
}

dump();
