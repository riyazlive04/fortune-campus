
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Find Trainer 1's branch
        const trainers = await prisma.trainer.findMany({
            include: { user: true, branch: true }
        });
        const trainer = trainers.find(t => t.user.firstName === 'Trainer' && t.user.lastName === '1');

        if (!trainer) {
            console.log('Trainer 1 not found');
            return;
        }

        const branchId = trainer.branchId;
        console.log(`Branch ID: ${branchId}`);

        // 2. Find the batch we created
        const batch = await prisma.batch.findFirst({
            where: { branchId: branchId, name: 'Test Batch 1' }
        });

        if (!batch) {
            console.log('Test Batch 1 not found');
            return;
        }
        console.log(`Batch ID: ${batch.id}`);

        // 3. Find students in this branch who have NO batch
        const students = await prisma.student.findMany({
            where: { branchId: branchId, batchId: null }
        });

        console.log(`Found ${students.length} students without batch.`);

        // 4. Update them
        if (students.length > 0) {
            const updateResult = await prisma.student.updateMany({
                where: { branchId: branchId, batchId: null },
                data: { batchId: batch.id }
            });
            console.log(`Updated ${updateResult.count} students to belong to Test Batch 1.`);
        } else {
            // Check if ANY student exists
            const allStudents = await prisma.student.findMany({ where: { branchId: branchId } });
            console.log(`Total students in branch: ${allStudents.length}`);
            if (allStudents.length > 0 && allStudents[0].batchId !== batch.id) {
                // Force update first student for testing
                await prisma.student.update({
                    where: { id: allStudents[0].id },
                    data: { batchId: batch.id }
                });
                console.log('Forced assigned first student to batch.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
