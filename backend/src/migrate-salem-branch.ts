import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    const sourceBranchId = '1e736840-e93c-4259-8fd7-c24c28b14413'; // 'Salem '
    const targetBranchId = '5b533e4c-1e6a-4972-8700-647837db8cf5'; // 'Salem'

    console.log(`Starting migration from ${sourceBranchId} to ${targetBranchId}...`);

    try {
        // 1. Update Users
        const updatedUsers = await prisma.user.updateMany({
            where: { branchId: sourceBranchId },
            data: { branchId: targetBranchId }
        });
        console.log(`Updated ${updatedUsers.count} users.`);

        // 2. Update Leads
        const updatedLeads = await prisma.lead.updateMany({
            where: { branchId: sourceBranchId },
            data: { branchId: targetBranchId }
        });
        console.log(`Updated ${updatedLeads.count} leads.`);

        // 3. Update Admissions (just in case)
        const updatedAdmissions = await prisma.admission.updateMany({
            where: { branchId: sourceBranchId },
            data: { branchId: targetBranchId }
        });
        console.log(`Updated ${updatedAdmissions.count} admissions.`);

        // 4. Update Students
        const updatedStudents = await prisma.student.updateMany({
            where: { branchId: sourceBranchId },
            data: { branchId: targetBranchId }
        });
        console.log(`Updated ${updatedStudents.count} students.`);

        // 5. Delete the source branch
        await prisma.branch.delete({
            where: { id: sourceBranchId }
        });
        console.log(`Deleted source branch: ${sourceBranchId}`);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
