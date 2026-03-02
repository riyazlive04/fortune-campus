const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTelecallers() {
    const telecallers = await prisma.user.findMany({
        where: { role: 'TELECALLER' },
        include: {
            assignedBranches: true,
            branch: true
        }
    });

    for (const t of telecallers) {
        console.log(`User: ${t.email}`);
        console.log(`  branchId: ${t.branchId}`);
        console.log(`  assignedBranches: ${t.assignedBranches.map(b => b.name).join(', ')}`);
    }
    await prisma.$disconnect();
}
checkTelecallers();
