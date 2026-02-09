
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Starting branch cleanup...');

    // 1. Get the new branches
    const branches = await prisma.branch.findMany({
        where: {
            code: { in: ['SLM', 'CBE', 'TRY', 'ERD'] }
        }
    });

    if (branches.length === 0) {
        console.error('No target branches found. Please seed them first.');
        return;
    }

    const salemBranch = branches.find(b => b.code === 'SLM') || branches[0];

    // 2. Find old branches (like FC-MAIN)
    const allBranches = await prisma.branch.findMany();
    const oldBranches = allBranches.filter(b => !['SLM', 'CBE', 'TRY', 'ERD'].includes(b.code));

    console.log(`Found ${oldBranches.length} old branches to remove.`);

    for (const old of oldBranches) {
        console.log(`Cleaning up branch: ${old.name} (${old.code})`);

        // Reassign users
        await prisma.user.updateMany({
            where: { branchId: old.id },
            data: { branchId: salemBranch.id }
        });

        // Reassign leads
        await prisma.lead.updateMany({
            where: { branchId: old.id },
            data: { branchId: salemBranch.id }
        });

        // Reassign admissions
        await prisma.admission.updateMany({
            where: { branchId: old.id },
            data: { branchId: salemBranch.id }
        });

        // Reassign students
        await prisma.student.updateMany({
            where: { branchId: old.id },
            data: { branchId: salemBranch.id }
        });

        // Reassign trainers
        await prisma.trainer.updateMany({
            where: { branchId: old.id },
            data: { branchId: salemBranch.id }
        });

        // Reassign courses
        await prisma.course.updateMany({
            where: { branchId: old.id },
            data: { branchId: salemBranch.id }
        });

        // Finally delete the branch
        await prisma.branch.delete({
            where: { id: old.id }
        });

        console.log(`✅ Deleted branch: ${old.name}`);
    }

    console.log('Cleanup completed successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
