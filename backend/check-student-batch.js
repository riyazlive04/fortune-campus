
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const trainer = await prisma.user.findFirst({
            where: { firstName: 'Trainer', lastName: '1' },
            include: { trainer: true }
        });

        if (!trainer || !trainer.trainer) return;

        const students = await prisma.student.findMany({
            where: { branchId: trainer.trainer.branchId, isActive: true },
            include: { batch: true, user: true }
        });

        console.log(`Found ${students.length} active students in branch.`);
        students.forEach(s => {
            console.log(`Student: ${s.user.firstName} ${s.user.lastName}, Batch: ${s.batch ? s.batch.name : 'NONE'}`);
        });

        // If a student has no batch, assign them to the first available batch
        const studentWithoutBatch = students.find(s => !s.batchId);
        if (studentWithoutBatch) {
            const batch = await prisma.batch.findFirst({ where: { branchId: trainer.trainer.branchId } });
            if (batch) {
                console.log(`Assigning ${studentWithoutBatch.user.firstName} to batch ${batch.name}...`);
                await prisma.student.update({
                    where: { id: studentWithoutBatch.id },
                    data: { batchId: batch.id }
                });
                console.log('Assigned.');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
