import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function syncCounters() {
    const branches = await prisma.branch.findMany({
        select: { id: true }
    });

    for (const branch of branches) {
        const [leads, admissions, students, revenue] = await Promise.all([
            prisma.lead.count({ where: { branchId: branch.id } }),
            prisma.admission.count({ where: { branchId: branch.id } }),
            prisma.student.count({ where: { branchId: branch.id } }),
            prisma.admission.aggregate({
                where: { branchId: branch.id },
                _sum: { feePaid: true }
            })
        ]);

        await (prisma.branch as any).update({
            where: { id: branch.id },
            data: {
                totalLeads: leads,
                totalAdmissions: admissions,
                totalStudents: students,
                totalRevenue: revenue._sum.feePaid || 0
            }
        });

        console.log(`Synced branch ${branch.id}: Leads=${leads}, Admissions=${admissions}, Students=${students}, Revenue=${revenue._sum.feePaid || 0}`);
    }
}

syncCounters()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
