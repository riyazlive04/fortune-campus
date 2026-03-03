const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncCounters() {
    const branches = await prisma.branch.findMany({
        select: { id: true, name: true }
    });

    for (const branch of branches) {
        const [leads, admissions, students, revenue, placements] = await Promise.all([
            prisma.lead.count({ where: { branchId: branch.id } }),
            prisma.admission.count({ where: { branchId: branch.id } }),
            prisma.student.count({ where: { branchId: branch.id } }),
            prisma.admission.aggregate({
                where: { branchId: branch.id },
                _sum: { feePaid: true }
            }),
            prisma.placement.count({
                where: { student: { branchId: branch.id } }
            })
        ]);

        // Use raw SQL to bypass client-side validation for new columns
        await prisma.$executeRawUnsafe(`
      UPDATE branches 
      SET "totalLeads" = ${leads}, 
          "totalAdmissions" = ${admissions}, 
          "totalStudents" = ${students}, 
          "totalRevenue" = ${Number(revenue._sum.feePaid || 0)},
          "totalPlacements" = ${placements}
      WHERE id = '${branch.id}'
    `);

        console.log(`Synced branch ${branch.name} (${branch.id}): Leads=${leads}, Admissions=${admissions}, Students=${students}, Revenue=${revenue._sum.feePaid || 0}, Placements=${placements}`);
    }
}

syncCounters()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
