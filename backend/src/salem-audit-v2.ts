import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function audit() {
    const branches = await prisma.branch.findMany({
        where: { name: { contains: 'Salem' } }
    });

    const results: any = { branches: [] };

    for (const b of branches) {
        const leads = await prisma.lead.findMany({
            where: { branchId: b.id },
            select: { id: true, firstName: true, lastName: true, status: true }
        });
        results.branches.push({
            id: b.id,
            name: b.name,
            code: b.code,
            leads: leads
        });
    }

    const telecallers = await prisma.user.findMany({
        where: { role: 'TELECALLER', branchId: { in: branches.map(b => b.id) } }
    });
    results.telecallers = telecallers.map(t => ({ id: t.id, name: `${t.firstName} ${t.lastName}`, branchId: t.branchId }));

    fs.writeFileSync('salem-audit-results.json', JSON.stringify(results, null, 2));
    console.log('Audit results saved to salem-audit-results.json');

    await prisma.$disconnect();
}

audit();
