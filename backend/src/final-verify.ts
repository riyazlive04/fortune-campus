import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('--- Final Verification: Simulated API Logic ---');

    // 1. Simulate Telecaller Fetch
    const t2 = await prisma.user.findFirst({
        where: { firstName: 'Telecaller 2' }
    });

    if (t2) {
        const where: any = { branchId: t2.branchId };
        const leads = await prisma.lead.findMany({ where });
        console.log(`\nTelecaller Fetch Simulation (User: ${t2.firstName}, Branch: ${t2.branchId})`);
        console.log(`Leads found: ${leads.length}`);
        leads.forEach(l => console.log(`  - ${l.firstName} [${l.status}]`));
    }

    // 2. Simulate CEO Fetch with Salem Filter
    const salemId = '1e736840-e93c-4259-8fd7-c24c28b14413';
    const whereCEO: any = { branchId: salemId };
    const leadsCEO = await prisma.lead.findMany({ where: whereCEO });

    console.log(`\nCEO Fetch Simulation (Filter Branch: ${salemId})`);
    console.log(`Leads found: ${leadsCEO.length}`);
    leadsCEO.forEach(l => console.log(`  - ${l.firstName} [${l.status}]`));

    // Check if Coimbatore leads appear in Salem filter
    const coimbatoreId = 'f0feca6f-a037-43e2-9407-8175a234fc46';
    const crossCheck = leadsCEO.filter(l => l.branchId === coimbatoreId);
    console.log(`\nCross-branch check (Coimbatore leads in Salem results): ${crossCheck.length}`);

    await prisma.$disconnect();
}

verify().catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
});
